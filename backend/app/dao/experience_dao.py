from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from app.models.experience import Experience

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"


class InMemoryExperienceDAO:
    def __init__(self) -> None:
        self._experiences: Dict[str, Experience] = {}
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "experiences.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            experience = Experience(
                id=item["id"],
                title=item["title"],
                badge=item.get("badge", ""),
                description=item.get("description", ""),
                features=item.get("features", []),
                link=item.get("link", ""),
                linkLabel=item.get("linkLabel", ""),
                featured=item.get("featured", False),
                premium=item.get("premium", False),
            )
            self._experiences[experience.id] = experience

    def get_all(self) -> List[Experience]:
        return list(self._experiences.values())

    def get_by_id(self, exp_id: str) -> Optional[Experience]:
        return self._experiences.get(exp_id)
