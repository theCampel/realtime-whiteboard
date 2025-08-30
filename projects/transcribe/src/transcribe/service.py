from __future__ import annotations

import uuid
from dataclasses import dataclass


@dataclass(slots=True)
class WhiteboardItem:
    uuid: str
    type: str


class WhiteboardService:
    def __init__(self) -> None:
        self._items: dict[str, WhiteboardItem] = {}
        self._edges: list[tuple[str, str]] = []

    def draw_item(self, item_type: str) -> str:
        item_uuid = str(uuid.uuid4())
        self._items[item_uuid] = WhiteboardItem(uuid=item_uuid, type=item_type)
        # TODO: draw the item
        return item_uuid

    def connect(self, item1_uuid: str, item2_uuid: str) -> None:
        if item1_uuid not in self._items:
            raise ValueError(f"Unknown item uuid: {item1_uuid}")
        if item2_uuid not in self._items:
            raise ValueError(f"Unknown item uuid: {item2_uuid}")
        self._edges.append((item1_uuid, item2_uuid))
        # TODO: draw the item

    def delete_item(self, item_uuid: str) -> None:
        if item_uuid in self._items:
            del self._items[item_uuid]
        # Remove any edges that referenced this item
        self._edges = [e for e in self._edges if item_uuid not in e]
        # TODO: remove the item

    # Introspection helpers for debugging/testing
    def list_items(self) -> list[WhiteboardItem]:
        return list(self._items.values())

    def list_edges(self) -> list[tuple[str, str]]:
        return list(self._edges)
