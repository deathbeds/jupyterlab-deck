*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Variables ***
${ZERO_PAD}     {0:03d}


*** Keywords ***
Start Deck With Notebook Toolbar Button
    [Documentation]    Use the notebook toolbar to start deck.
    Wait Until Element Is Not Visible    css:${CSS_LAB_SPINNER}
    Click Element    css:${JLAB CSS ACTIVE DOC}
    Click Element    css:${CSS_DECK_NOTEBOOK_BUTTON}
    Wait Until Element Is Visible    css:${CSS_DECK_PRESENTING}
    Wait Until Element Is Visible    css:${CSS_DECK_VISIBLE}

Really Start Deck With Notebook Toolbar Button
    [Documentation]    REALLY use the notebook toolbar to start deck.
    Wait Until Keyword Succeeds    5x    0.1s    Start Deck With Notebook Toolbar Button

Stop Deck With Remote
    [Documentation]    Use the on-screen remote to stop deck.
    Wait Until Element Is Visible    css:${CSS_DECK_STOP}
    Click Element    css:${CSS_DECK_STOP}
    Wait Until Element Is Not Visible    css:${CSS_DECK_PRESENTING}

Visit Slides And Fragments With Remote
    [Documentation]    Walk through all slides and fragments.
    [Arguments]    ${prefix}    ${directions}=${CSS_DECK_NEXT}    ${limit}=${100}
    ${keep_going} =    Set Variable    ${TRUE}
    ${i} =    Set Variable    ${0}
    WHILE    ${keep_going}    limit=${limit}
        ${i} =    Set Variable    ${i.__add__(1)}
        ${keep_going} =    Set Variable    ${FALSE}
        FOR    ${direction}    IN    @{directions}
            ${sel} =    Set Variable    ${CSS_DECK_DIR_STEM}-${direction}
            ${els} =    Get WebElements    css:${sel}:not(${CSS_LAB_MOD_DISABLED})
            IF    ${els.__len__()}
                ${keep_going} =    Set Variable    ${TRUE}
                Advance Deck With Remote And Screenshot    ${els[0]}    ${prefix}    ${i}    ${direction}
                BREAK
            END
        END
    END
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i.__add__(1)})}-FIN.png

Advance Deck With Remote And Screenshot
    [Documentation]    Advance a direction, wait a bit, and take a screenshot.
    [Arguments]    ${element}    ${prefix}    ${i}    ${suffix}
    Click Element    ${element}
    Sleep    0.1s
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i})}-${suffix}.png

Advance Deck With Keyboard
    [Documentation]    Go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    ${index} =    Get Active Cell Index
    IF    ${backup}
        Press Keys    css:body    SHIFT+SPACE
    ELSE
        Press Keys    css:body    SPACE
    END
    Wait Until Cell Is Not Active    ${index}    1s
    IF    ${expect.__len__()}
        Wait Until Element Contains    css:${JLAB CSS ACTIVE CELL}    ${expect}
    ELSE
        Sleep    0.2s
    END
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Back Up Deck With Keyboard
    [Documentation]    Go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Advance Deck With Keyboard    ${screenshot}    ${expect}    backup=${TRUE}

Really Advance Deck With Keyboard
    [Documentation]    REALLY go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Advance Deck With Keyboard    ${screenshot}    ${expect}    ${backup}

Really Back Up Deck With Keyboard
    [Documentation]    REALLY go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Really Advance Deck With Keyboard    ${screenshot}    ${expect}    backup=${TRUE}

Make Cell Layer
    [Documentation]    Use the Property Inspector to make a cell a layer
    [Arguments]    ${idx}    ${layer}    ${screenshot}=${EMPTY}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${idx})
    Maybe Open JupyterLab Sidebar    Property Inspector
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
    Maybe Open Cell Metadata JSON
    Select From List By Value    css:${CSS_DECK_PRESET_SELECT}    ${preset}
    Click Element    css:${CSS_DECK_TOOL_PRESET} button
    IF    ${expect.__len__()}    Wait Until Cell Metadata Contains    ${expect}
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
