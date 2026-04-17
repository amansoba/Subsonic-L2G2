/* Player modal logic with Spotify Embed support.
   - Opens on click of any `.artist-card` element.
   - Reads `data-artist`, `data-stage`, `data-track`, `data-spotify-track-id`,
     `data-spotify-start-index`, and `data-spotify-tracks`.
*/
(function(){
  let spotifyEmbedRequestId = 0;
  let currentTracks = [];
  let currentTrackIndex = 0;

  function slugify(name){
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_|_$/g,'');
  }

  function escapeHtml(value){
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseTracks(card){
    const raw = card.dataset.spotifyTracks;
    if(raw){
      try {
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed)){
          return parsed
            .filter(track => track && (track.id || track.searchUrl))
            .map(track => ({
              id: track.id ? String(track.id) : '',
              name: track.name || 'Spotify track',
              artistId: track.artistId || '',
              fallbackEmbed: track.fallbackEmbed || null,
              searchUrl: track.searchUrl || '',
            }));
        }
      } catch(_) {}
    }

    if(card.dataset.spotifyTrackId){
      return [{
        id: card.dataset.spotifyTrackId,
        name: card.dataset.track || 'Spotify track',
      }];
    }

    return [];
  }

  function ensureArtistModal(){
    let modal = document.getElementById('artistModal');
    if(modal) return modal;

    modal = document.createElement('div');
    modal.id = 'artistModal';
    modal.className = 'artist-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'artistModalTitle');
    modal.innerHTML = `
      <div class="artist-modal-overlay"></div>
      <div class="artist-modal-content">
        <button class="artist-modal-close" aria-label="Cerrar reproductor" type="button">
          <span aria-hidden="true">x</span>
        </button>
        <div class="artist-modal-body">
          <div class="artist-modal-info">
            <div class="artist-modal-stage" id="artistModalStage">STAGE</div>
            <h2 id="artistModalTitle" class="artist-modal-artist">Artist Name</h2>
            <div class="artist-modal-track">
              <p class="artist-modal-track-title" id="artistModalTrackTitle">Spotify</p>
              <p class="artist-modal-track-artist" id="artistModalTrackArtist">Artist Name</p>
            </div>
            <div class="artist-modal-footer" id="artistModalFooter"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function destroySpotifyController(){
    spotifyEmbedRequestId += 1;
  }

  function stopSpotifyPlayback(){
    destroySpotifyController();

    const host = document.getElementById('spotifyEmbedHost');
    if(host){
      host.querySelectorAll('iframe').forEach(iframe => {
        iframe.src = 'about:blank';
        iframe.remove();
      });
      resetSpotifyEmbedHost(host);
    }

    currentTracks = [];
    currentTrackIndex = 0;
  }

  function resetSpotifyEmbedHost(host){
    if(!host) return null;
    host.innerHTML = '<div id="spotifyEmbedMount" style="width:100%; min-height:152px;"></div>';
    return host.querySelector('#spotifyEmbedMount');
  }

  function renderStaticSpotifyIframe(host, track){
    const fallbackMount = resetSpotifyEmbedHost(host) || host;
    const embedType = track.embedType || 'track';
    const embedId = track.embedId || track.id;
    fallbackMount.innerHTML = `
      <iframe
        style="border-radius:12px"
        src="https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0"
        width="100%"
        height="${embedType === 'track' ? '152' : '352'}"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"></iframe>
    `;
  }

  function updateTrackText(track){
    const title = document.getElementById('artistModalTrackTitle');
    if(title) title.textContent = track?.name || 'Spotify';
  }

  function stripCustomPlayerChrome(modal){
    modal.querySelectorAll('.artist-modal-album, .artist-modal-progress, .artist-modal-controls').forEach(node => node.remove());
  }

  function renderTrackPicker(){
    const picker = document.getElementById('artistModalTrackPicker');
    if(!picker) return;

    if(currentTracks.length <= 1){
      picker.innerHTML = '';
      return;
    }

    picker.innerHTML = currentTracks.map((track, index) => `
      <button
        class="spotify-track-chip ${index === currentTrackIndex ? 'active' : ''}"
        type="button"
        data-track-index="${index}"
      >${escapeHtml(track.name)}</button>
    `).join('');
  }

  function ensureEmbedShell(modal, trackName){
    const footer = modal.querySelector('#artistModalFooter');
    if(!footer) return null;

    if(!footer.querySelector('#spotifyEmbedHost')){
      footer.innerHTML = `
        <div id="artistModalTrackPicker" class="spotify-track-picker"></div>
        <div class="spotify-embed-kicker">Spotify Embed</div>
        <div id="spotifyEmbedHost" style="width:100%; min-height:152px;"></div>
      `;
    } else {
      const kicker = footer.querySelector('.spotify-embed-kicker');
      if(kicker) kicker.textContent = 'Spotify Embed';
    }

    renderTrackPicker();
    return footer.querySelector('#spotifyEmbedHost');
  }

  function loadCurrentTrack(options){
    const modal = document.getElementById('artistModal');
    const track = currentTracks[currentTrackIndex];
    if(!modal || !track) return;

    updateTrackText(track);
    stripCustomPlayerChrome(modal);
    const host = ensureEmbedShell(modal, track.name);
    if(!host) return;

    if(!track.id){
      destroySpotifyController();
      const fallbackEmbed = track.fallbackEmbed || null;
      if(fallbackEmbed && fallbackEmbed.id && fallbackEmbed.type){
        renderStaticSpotifyIframe(host, {
          embedType: fallbackEmbed.type,
          embedId: fallbackEmbed.id,
        });
        return;
      }
      if(track.artistId){
        renderStaticSpotifyIframe(host, {
          embedType: 'artist',
          embedId: track.artistId,
        });
        return;
      }
      return;
    }

    destroySpotifyController();
    renderStaticSpotifyIframe(host, track);
  }

  function renderNoTracks(modal, artistName){
    destroySpotifyController();
    const footer = modal.querySelector('#artistModalFooter');
    if(footer){
      footer.innerHTML = `
        <small>No hay canciones de Spotify conectadas para ${escapeHtml(artistName)} todavía.</small>
        <a
          class="btn secondary"
          href="https://open.spotify.com/search/${encodeURIComponent(artistName)}"
          target="_blank"
          rel="noopener noreferrer"
          style="margin-top:10px;"
        >Buscar en Spotify</a>
      `;
    }
  }

  function openArtistModalFor(card){
    const modal = ensureArtistModal();
    const title = modal.querySelector('#artistModalTitle');
    const stage = modal.querySelector('#artistModalStage');
    const trackTitle = modal.querySelector('#artistModalTrackTitle');
    const trackArtist = modal.querySelector('#artistModalTrackArtist');

    const artistName = card.dataset.artist || card.querySelector('.artist-name')?.textContent?.trim() || card.textContent.trim().slice(0,40) || 'Artist';
    const stageName = card.dataset.stage || card.querySelector('.artist-stage')?.textContent?.trim() || '';
    currentTracks = parseTracks(card);
    currentTrackIndex = Math.max(0, Math.min(
      Number(card.dataset.spotifyStartIndex || 0),
      Math.max(0, currentTracks.length - 1)
    ));
    const track = currentTracks[currentTrackIndex] || { name: card.dataset.track || 'Spotify' };

    title && (title.textContent = artistName);
    stage && (stage.textContent = stageName);
    trackTitle && (trackTitle.textContent = track.name);
    trackArtist && (trackArtist.textContent = artistName);
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';

    if(currentTracks.length === 0){
      renderNoTracks(modal, artistName);
    } else {
      destroySpotifyController();
      loadCurrentTrack({ play: false });
    }
    return true;
  }

  function closeArtistModal(){
    const modal = document.getElementById('artistModal');
    if(!modal) return;
    stopSpotifyPlayback();
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function init(){
    document.addEventListener('click', function(e){
      const card = e.target.closest('.artist-card');
      if(!card) return;
      if(e.target.closest('a[href]')) return;
      openArtistModalFor(card);
    });

    document.addEventListener('click', function(e){
      const modal = document.getElementById('artistModal');
      if(!modal) return;
      if(e.target.closest('.artist-modal-close')) closeArtistModal();
      if(e.target.classList && e.target.classList.contains('artist-modal-overlay')) closeArtistModal();
    });

    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      closeArtistModal();
    });

    window.addEventListener('pagehide', stopSpotifyPlayback);

    document.addEventListener('click', function(e){
      const chip = e.target.closest('.spotify-track-chip');
      if(chip){
        currentTrackIndex = Number(chip.dataset.trackIndex || 0);
        loadCurrentTrack({ play: false });
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
