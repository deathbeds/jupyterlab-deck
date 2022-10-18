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
${CSS_DECK_STOP}                [data-icon="deck:stop"]
${CSS_DECK_FORWARD}             .jp-deck-mod-direction-forward
${CSS_DECK_BACK}                .jp-deck-mod-direction-back
${CSS_DECK_UP}                  .jp-deck-mod-direction-up
${CSS_DECK_DOWN}                .jp-deck-mod-direction-down

@{CSS_DECK_NEXT}                ${CSS_DECK_DOWN}    ${CSS_DECK_FORWARD}
@{CSS_DECK_PREV}                ${CSS_DECK_UP}    ${CSS_DECK_BACK}
