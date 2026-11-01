"""Presentation Maker package for VidCraft AI Service."""

from .generator import generate_presentation_deck, THEME_PRESETS
from .pptx_builder import create_pptx_deck

__all__ = [
    "generate_presentation_deck",
    "THEME_PRESETS",
    "create_pptx_deck",
]
