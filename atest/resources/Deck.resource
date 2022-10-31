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
    [Arguments]    ${host}    ${prefix}    ${directions}=${CSS_DECK_NEXT}    ${limit}=${100}
    ${keep_going} =    Set Variable    ${TRUE}
    ${i} =    Set Variable    ${0}
    WHILE    ${keep_going}    limit=${limit}
        ${i} =    Set Variable    ${i.__add__(1)}
        ${keep_going} =    Set Variable    ${FALSE}
        FOR    ${direction}    IN    @{directions}
            ${els} =    Get WebElements    css:${CSS_DECK_DIR_STEM}-${direction}:not(${CSS_LAB_MOD_DISABLED})
            IF    ${els.__len__()}
                ${keep_going} =    Advance Deck With Remote And Screenshot
                ...    ${host}    ${els[0]}    ${prefix}    ${i}    ${direction}
                BREAK
            END
        END
    END
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i.__add__(1)})}-FIN.png

Advance Deck With Remote And Screenshot
    [Documentation]    Advance a direction, wait a bit, and take a screenshot.
    [Arguments]    ${host}    ${element}    ${prefix}    ${i}    ${suffix}
    Click Element    ${element}
    Sleep    0.1s
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i})}-${suffix}.png
    Maybe Click An Anchor And Return    ${host}    ${prefix}-${ZERO_PAD.format(${i})}-${suffix}-anchor.png
    RETURN    ${TRUE}

Maybe Click An Anchor And Return
    [Documentation]    If a `#` anchor exists, click it, and come back
    [Arguments]    ${host}    ${screenshot}=${EMPTY}
    IF    ${host.__contains__(".ipynb")}
        ${anchor_links} =    Get WebElements    css:${JLAB CSS ACTIVE CELL} a[href*\="#"]
    ELSE
        ${anchor_links} =    Get WebElements    css:${JLAB CSS ACTIVE DOC} a[href*\="#"]
    END
    IF    not ${anchor_links.__len__()}    RETURN
    ${href} =    Get Element Attribute    ${anchor_links[0]}    href
    IF    ${href.__contains__('''${host}''')}    RETURN
    Click Element    ${anchor_links[0]}
    Sleep    0.1s
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
    Click Element    css:${CSS_DECK_DIR_STACK} button
    Sleep    0.1s

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
