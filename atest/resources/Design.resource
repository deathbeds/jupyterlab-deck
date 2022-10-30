*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Variables ***
@{PART_HANDLES}     nw    n    ne    w    e    sw    s    se
@{SLIDE_TYPES}      slide    subslide    null    fragment
@{LAYER_SCOPES}     deck    stack    slide    fragment    null


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
    IF    not ${screenshot.__len__()}    RETURN
    Capture Page Screenshot    ${screenshot}

Resize A Part
    [Documentation]    Resize a part by dragging and dropping the handle
    [Arguments]    ${index}    ${handle}    ${x}    ${y}    ${screenshot}=${EMPTY}
    ${sel} =    Set Variable    ${CSS_DECK_LAYOVER_PART}:nth-child(${index}) ${CSS_DECK_PART_HANDLE}-${handle}
    Drag And Drop By Offset    css:${sel}    ${x}    ${y}
    Sleep    0.1s
    IF    not ${screenshot.__len__()}    RETURN
    Capture Page Screenshot    ${screenshot}

Select A Slide Type
    [Documentation]    Make a cell a slide type with the design tools.
    [Arguments]    ${index}    ${type}    ${screenshot}=${EMPTY}
    Select From Selector Tool    ${index}    ${type}    ${screenshot}
    ...    ${CSS_DECK_MOD_SLIDE_TYPE}    ${CSS_DECK_ICON_SLIDE_FMT}

Select A Layer Scope
    [Documentation]    Make a cell a layer with the design tools.
    [Arguments]    ${index}    ${scope}    ${screenshot}=${EMPTY}
    Select From Selector Tool    ${index}    ${scope}    ${screenshot}
    ...    ${CSS_DECK_MOD_LAYER_SCOPE}    ${CSS_DECK_ICON_LAYER_FMT}

Select From Selector Tool
    [Documentation]    Select an option from a selector tool.
    [Arguments]    ${index}    ${kind}    ${screenshot}    ${tool}    ${fmt}
    Maybe Open Design Tools
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    Mouse Over    css:${tool}
    Sleep    0.1s
    Mouse Over    css:${tool}
    ${icon} =    Set Variable    ${fmt.format("${kind}")}
    Click Element    css:${tool} ${icon}
    Mouse Over    css:${CSS_DECK_DESIGN_TOOLS} ${CSS_LAB_ICON_CARET_LEFT}
    Wait Until Element Is Visible    css:${tool} ${CSS_LAB_MOD_ACTIVE} ${icon}
    IF    not ${screenshot.__len__()}
        Capture Page Screenshot    ${screenshot}
    END

Reset Design Tools Test
    [Documentation]    Reset the test, ensuring the design tools are closed first.
    Maybe Close Design Tools
    Reset Interactive Test
