*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Keywords ***
Maybe Open Design Tools
    [Documentation]    Ensure the design tools are open.
    ${sel} =    Set Variable    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_LAB_ICON_ELLIPSES}
    ${el} =    Get WebElements    ${sel}
    IF    ${el.__len__()}    Click Element    ${sel}
    Wait Until Element Is Visible    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_LAB_ICON_CARET_LEFT}

Maybe Open Slide Layout
    [Documentation]    Ensure the slide layout overlay is open.
    Maybe Open Design Tools
    ${sel} =    Set Variable    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_DECK_ICON_LAYOVER_START}
    ${el} =    Get WebElements    ${sel}
    IF    ${el.__len__()}    Click Element    ${sel}
    Wait Until Element Is Visible    css:${CSS_DECK_LAYOVER_PART}

Maybe Close Slide Layout
    [Documentation]    Ensure the slide layout overlay is closed.
    ${sel} =    Set Variable    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_DECK_ICON_LAYOVER_STOP}
    ${el} =    Get WebElements    ${sel}
    IF    ${el.__len__()}    Click Element    ${sel}
    Wait Until Element Is Not Visible    css:${CSS_DECK_LAYOVER_PART}

Maybe Close Design Tools
    [Documentation]    Ensure the design tools are closed.
    Maybe Close Slide Layout
    ${sel} =    Set Variable    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_LAB_ICON_CARET_LEFT}
    ${el} =    Get WebElements    ${sel}
    IF    ${el.__len__()}    Click Element    ${sel}
    Wait Until Element Is Visible    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_LAB_ICON_ELLIPSES}

Move A Part
    [Documentation]    Move a part by dragging and dropping
    [Arguments]    ${index}    ${x}    ${y}    ${screenshot}=${EMPTY}
    ${sel} =    Set Variable    ${CSS_DECK_LAYOVER_PART}:nth-child(${index})
    Drag And Drop By Offset    css:${sel}    ${x}    ${y}
    Sleep    0.1s
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Resize A Part
    [Documentation]    Resize a part by dragging and dropping the handle
    [Arguments]    ${index}    ${handle}    ${x}    ${y}    ${screenshot}=${EMPTY}
    ${sel} =    Set Variable    ${CSS_DECK_LAYOVER_PART}:nth-child(${index}) ${CSS_DECK_PART_HANDLE}-${handle}
    Drag And Drop By Offset    css:${sel}    ${x}    ${y}
    Sleep    0.1s
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
