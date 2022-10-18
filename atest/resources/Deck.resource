*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource


*** Keywords ***
Start Deck With Notebook Toolbar Button
    [Documentation]    Use the notebook toolbar to start deck.
    Wait Until Element Is Not Visible    css:${CSS_LAB_SPINNER}
    Click Element    css:${CSS_DECK_NOTEBOOK_BUTTON}
    Wait Until Element Is Visible    css:${CSS_DECK_PRESENTING}
    Wait Until Element Is Visible    css:${CSS_DECK_VISIBLE}

Stop Deck With Remote
    [Documentation]    Use the on-screen remote to stop deck.
    Click Element    css:${CSS_DECK_STOP}
    Wait Until Element Is Not Visible    css:${CSS_DECK_PRESENTING}
