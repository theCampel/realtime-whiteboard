from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from agents import Agent, RunContextWrapper, function_tool

from .service import WhiteboardService

SYSTEM_PROMPT = (
    "You control a whiteboard. Interpret spoken instructions as immediate tool calls. "
    "Do not wait for full sentences if a coherent unit of action is clear. "
    "Allowed item types: database, person. Return UUIDs from draw_item and reuse them."
)


class ItemType(str, Enum):
    DATABASE = "database"
    PERSON = "person"


def parse_item_type(value: str) -> ItemType:
    """Parse a string into an ItemType, raising ValueError if invalid."""
    try:
        return ItemType(value.lower())
    except Exception as exc:  # noqa: BLE001 - propagate as ValueError with context
        raise ValueError(f"Unsupported item_type '{value}'. Allowed: {[t.value for t in ItemType]}") from exc


@dataclass
class Context:
    service: WhiteboardService


@function_tool
def draw_item(wrapper: RunContextWrapper[Context], item_type: str) -> str:
    item_enum = parse_item_type(item_type)
    return wrapper.context.service.draw_item(item_enum.value)


@function_tool
def connect(wrapper: RunContextWrapper[Context], item1_uuid: str, item2_uuid: str) -> None:
    wrapper.context.service.connect(item1_uuid, item2_uuid)


@function_tool
def delete_item(wrapper: RunContextWrapper[Context], item_uuid: str) -> None:
    wrapper.context.service.delete_item(item_uuid)


def create_agent() -> tuple[Agent, WhiteboardService]:
    agent = Agent[Context](
        system_prompt=SYSTEM_PROMPT,
        tools=[
            tools.draw_item,
            tools.connect,
            tools.delete_item,
        ],
    )

    return agent, service
