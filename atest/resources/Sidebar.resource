*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Keywords ***
Make Cell Layer With Sidebar
    [Documentation]    Use the Property Inspector to make a cell a layer
    [Arguments]    ${idx}    ${layer}    ${screenshot}=${EMPTY}
    Reveal Cell Metadata JSON For Cell    ${idx}
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
    Reveal Cell Metadata JSON For Cell    ${idx}
    Wait Until Element Is Visible    css:${CSS_DECK_PRESET_SELECT} [value\="${preset}"]
    Mouse Over    css:${CSS_DECK_PRESET_SELECT}
    Select From List By Value    css:${CSS_DECK_PRESET_SELECT}    ${preset}
    Click Element    css:${CSS_DECK_TOOL_PRESET} button
    IF    ${expect.__len__()}    Wait Until Cell Metadata Contains    ${expect}
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Reveal Cell Metadata JSON For Cell
    [Documentation]    Ensure the Cell Metadata JSON is visible.
    [Arguments]    ${idx}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${idx})
    Maybe Open JupyterLab Sidebar    Property Inspector
    Maybe Open Cell Metadata JSON
    Capture Page Screenshot
