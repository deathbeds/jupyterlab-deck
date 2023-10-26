*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Keywords ***
Make Cell Layer With Sidebar
    [Documentation]    Use the Property Inspector to make a cell a layer
    [Arguments]    ${idx}    ${layer}    ${screenshot}=${EMPTY}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${idx})
    Maybe Open JupyterLab Sidebar    Property Inspector
    Maybe Expand Panel With Title    Advanced Tools
    Maybe Expand Panel With Title    Common Tools
    Maybe Open Cell Metadata JSON
    Select From List By Value    css:${CSS_DECK_LAYER_SELECT}    ${layer}
    IF    '${layer}' != '-'
        Wait Until Cell Metadata Contains    "layer": "${layer}"
    ELSE
        Wait Until Cell Metadata Does Not Contain    jupyterlab-deck
    END
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Use Cell Style Preset
    [Documentation]    Use the Property Inspector to use a cell preset
    [Arguments]    ${idx}    ${preset}    ${expect}=${EMPTY}    ${screenshot}=${EMPTY}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${idx})
    Maybe Open JupyterLab Sidebar    Property Inspector
    Maybe Expand Panel With Title    Advanced Tools
    Maybe Expand Panel With Title    Common Tools
    Maybe Open Cell Metadata JSON
    Select From List By Value    css:${CSS_DECK_PRESET_SELECT}    ${preset}
    Click Element    css:${CSS_DECK_TOOL_PRESET} button
    IF    ${expect.__len__()}    Wait Until Cell Metadata Contains    ${expect}
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
