*** Settings ***
Documentation       Selectors defined in this repo... could be loaded from JSON?


*** Variables ***
# body
${CSS_DECK_PRESENTING}          [data-jp-deck-mode="presenting"]
# notebook
${CSS_DECK_NOTEBOOK_BUTTON}     .jp-ToolbarButtonComponent\[data-command="deck:toggle"]
# cells
${CSS_DECK_VISIBLE}             .jp-deck-mod-visible
${CSS_DECK_ONSCREEN}            .jp-deck-mod-onscreen
# remote
${CSS_DECK_STOP}                .jp-Deck-Remote .jp-deck-mod-stop
${CSS_DECK_FORWARD}             .jp-Deck-Remote .jp-deck-mod-direction-forward
${CSS_DECK_BACK}                .jp-Deck-Remote .jp-deck-mod-direction-back
${CSS_DECK_UP}                  .jp-Deck-Remote .jp-deck-mod-direction-up
${CSS_DECK_DOWN}                .jp-Deck-Remote .jp-deck-mod-direction-down
${CSS_DECK_DIR_STEM}            .jp-Deck-Remote .jp-deck-mod-direction

@{CSS_DECK_NEXT}                down    forward
@{CSS_DECK_PREV}                up    back

# metadata
${CSS_DECK_LAYER_SELECT}        \#id-jp-decktools-select-layer
${CSS_DECK_PRESET_SELECT}       \#id-jp-decktools-select-preset
${CSS_DECK_TOOL_PRESET}         .jp-Deck-Tool-preset
