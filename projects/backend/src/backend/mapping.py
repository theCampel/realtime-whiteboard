# Shape mapping: converts item types to tldraw shape definitions

from typing import Any, Dict


def get_shape_definition(item_type: str, unique_name: str, position: tuple[float, float] = (100, 100)) -> Dict[str, Any]:
    """
    Convert an item type to a tldraw shape definition.
    
    Args:
        item_type: The type of item (e.g., "database", "server", "user")
        unique_name: Unique identifier for this shape
        position: (x, y) position on the canvas
    
    Returns:
        tldraw shape definition as a dictionary
    """
    
    # Basic shape mappings - expand this as needed
    shape_templates = {
        "database": {
            "type": "geo",
            "props": {
                "geo": "ellipse",
                "w": 120,
                "h": 80,
                "fill": "solid",
                "color": "blue",
                "text": unique_name
            }
        },
        "server": {
            "type": "geo", 
            "props": {
                "geo": "rectangle",
                "w": 100,
                "h": 60,
                "fill": "solid",
                "color": "green",
                "text": unique_name
            }
        },
        "user": {
            "type": "geo",
            "props": {
                "geo": "ellipse", 
                "w": 80,
                "h": 80,
                "fill": "solid",
                "color": "orange",
                "text": unique_name
            }
        }
    }
    
    template = shape_templates.get(item_type.lower(), {
        "type": "geo",
        "props": {
            "geo": "rectangle",
            "w": 100,
            "h": 60, 
            "fill": "solid",
            "color": "gray",
            "text": f"{item_type}: {unique_name}"
        }
    })
    
    # Create the full shape definition
    shape = {
        "id": unique_name,
        "type": template["type"],
        "x": position[0],
        "y": position[1],
        "props": template["props"]
    }
    
    return shape


def get_connection_definition(item1: str, item2: str) -> Dict[str, Any]:
    """
    Create a tldraw arrow/line connecting two items.
    
    Args:
        item1: ID of the first item
        item2: ID of the second item
    
    Returns:
        tldraw arrow shape definition
    """
    connection_id = f"connection_{item1}_{item2}"
    
    return {
        "id": connection_id,
        "type": "arrow",
        "props": {
            "start": {"type": "binding", "boundShapeId": item1, "normalizedAnchor": {"x": 0.5, "y": 0.5}},
            "end": {"type": "binding", "boundShapeId": item2, "normalizedAnchor": {"x": 0.5, "y": 0.5}},
            "color": "black",
            "size": "m"
        }
    }
