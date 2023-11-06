*** Settings ***
Documentation       Selectors defined in this repo... could be loaded from JSON?

Resource            ./LabSelectors.resource


*** Variables ***
# body
${CSS_DECK_PRESENTING}              [data-jp-deck-mode="presenting"]

# deck
${CSS_DECK}                         .jp-Deck

# remote
${CSS_DECK_REMOTE}                  .jp-Deck-Remote
${CSS_DECK_STOP}                    ${CSS_DECK_REMOTE} .jp-deck-mod-stop
${CSS_DECK_FORWARD}                 ${CSS_DECK_REMOTE} .jp-deck-mod-direction-forward
${CSS_DECK_BACK}                    ${CSS_DECK_REMOTE} .jp-deck-mod-direction-back
${CSS_DECK_UP}                      ${CSS_DECK_REMOTE} .jp-deck-mod-direction-up
${CSS_DECK_DOWN}                    ${CSS_DECK_REMOTE} .jp-deck-mod-direction-down
${CSS_DECK_DIR_STEM}                ${CSS_DECK_REMOTE} .jp-deck-mod-direction
${CSS_DECK_DIR_STACK}               ${CSS_DECK_REMOTE} .jp-Deck-Remote-WidgetStack

@{CSS_DECK_NEXT}                    down    forward
@{CSS_DECK_PREV}                    up    back

# notebook
${CSS_DECK_TOOLBAR_BUTTON}          ${CSS_LAB_DOC_TOOLBAR_BTN}\[data-command="deck:toggle"]
${CSS_DECK_VISIBLE}                 .jp-deck-mod-visible
${CSS_DECK_ONSCREEN}                .jp-deck-mod-onscreen

# metadata
${CSS_DECK_LAYER_SELECT}            \#id-jp-decktools-select-layer
${CSS_DECK_PRESET_SELECT}           \#id-jp-decktools-select-preset
${CSS_DECK_TOOL_PRESET}             .jp-Deck-Tool-preset

# design
${CSS_DECK_DESIGN_TOOLS}            .jp-Deck-DesignTools
${CSS_DECK_ICON_LAYOVER_START}      [data-icon="deck:layover-start"]
${CSS_DECK_ICON_LAYOVER_STOP}       [data-icon="deck:layover-stop"]
${CSS_DECK_LAYOVER_PART}            .jp-Deck-LayoverPart
${CSS_DECK_LAYOVER_UNSTYLE}         .jp-Deck-LayoverUnstyle
${CSS_DECK_PART_HANDLE}             .jp-Deck-LayoverHandle
${CSS_DECK_MOD_SLIDE_TYPE}          .jp-deck-mod-slidetype
${CSS_DECK_MOD_LAYER_SCOPE}         .jp-deck-mod-layerscope
${CSS_DECK_ICON_SLIDE_FMT}          [data-icon="deck:slide-{}"]
${CSS_DECK_ICON_LAYER_FMT}          [data-icon="deck:layer-{}"]
${CSS_DECK_SLIDER}                  .jp-Deck-DesignTools-Slider
${CSS_DECK_SLIDER_FMT}              ${CSS_DECK_SLIDER}.jp-deck-mod-{}
