*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource
Resource            ./Lab.resource


*** Variables ***
${ZERO_PAD}     {0:03d}


*** Keywords ***
Start Deck With Toolbar Button
    [Documentation]    Use the toolbar to start deck.
    Wait Until Element Is Not Visible    css:${CSS_LAB_SPINNER}    timeout=1s
    Click Element    css:${JLAB CSS ACTIVE DOC}
    Click Element    css:${CSS_DECK_TOOLBAR_BUTTON}
    Wait Until Element Is Visible    css:${CSS_DECK_PRESENTING}    timeout=1s
    Wait Until Element Is Visible    css:${CSS_DECK_REMOTE}    timeout=1s

Really Start Deck With Toolbar Button
    [Documentation]    REALLY use the toolbar to start deck.
    Send Error Screenshots To Trash
    Wait Until Keyword Succeeds    5x    0.1s    Start Deck With Toolbar Button
    [Teardown]    Resume Screenshots

Select From Context Menu
    [Documentation]    Open the context menu and click an item.
    [Arguments]    ${host}    ${item}
    Open Context Menu    css:${host}
    Wait Until Element Is Visible    css:${item}
    Mouse Over    css:${item} ${CSS_LM_MENU_ITEM_LABEL}
    Wait Until Element Is Visible    css:${item}${CSS_LM_MOD_ACTIVE}
    Click Element    css:${item}${CSS_LM_MOD_ACTIVE} ${CSS_LM_MENU_ITEM_LABEL}
    Wait Until Element Is Not Visible    css:${item}

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
    ${anchor_links} =    Find Cross-Document Anchor Links    ${host}
    IF    not ${anchor_links.__len__()}    RETURN
    ${href} =    Get Element Attribute    ${anchor_links[0]}    href
    IF    ${href.__contains__('''${host}''')}    RETURN
    Click Element    ${anchor_links[0]}
    Sleep    0.1s
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
    Click Element    css:${CSS_DECK_DIR_STACK} button
    Sleep    0.1s

Find Cross-Document Anchor Links
    [Documentation]    Find anchor links that don't reference their host.
    [Arguments]    ${host}
    ${anchor_links} =    Create List
    IF    ${host.__contains__(".ipynb")}
        ${anchor_links} =    Get WebElements
        ...    css:${JLAB CSS ACTIVE CELL}${CSS_DECK_VISIBLE} ${CSS_LAB_NOT_INTERNAL_ANCHOR}
    ELSE IF    ${host.__contains__(".md")}
        ${anchor_links} =    Get WebElements
        ...    css:${CSS_LAB_MARKDOWN_VIEWER} ${CSS_LAB_NOT_INTERNAL_ANCHOR}:not([href^\='#'])
    END
    ${anchor_links} =    Filter Visible Elements    ${anchor_links}
    RETURN    ${anchor_links}

Filter Visible Elements
    [Documentation]    Filter a list down to just the visible ones.
    [Arguments]    ${elements}
    ${visible} =    Create List
    Send Error Screenshots To Trash
    FOR    ${el}    IN    @{elements}
        TRY
            Element Should Be Visible    ${el}
            Append To List    ${visible}    ${el}
        EXCEPT
            Log    ${el} is not visible
        END
    END
    RETURN    ${visible}
    [Teardown]    Resume Screenshots

Advance Notebook Deck With Space
    [Documentation]    Go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    ${index} =    Get Active Cell Index
    Send Error Screenshots To Trash
    IF    ${backup}
        Press Keys    css:body    SHIFT+SPACE
    ELSE
        Press Keys    css:body    SPACE
    END
    Wait Until Cell Is Not Active    ${index}    1s
    IF    ${expect.__len__()}
        Wait Until Element Contains    css:${JLAB CSS ACTIVE CELL}    ${expect}
    END
    Resume Screenshots
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
    [Teardown]    Resume Screenshots

Back Or Forward Notebook Deck With Arrows
    [Documentation]    Go to the back/forward slide with arrows, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    ${index} =    Get Active Cell Index
    Send Error Screenshots To Trash
    IF    ${backup}
        Press Keys    css:body    ARROW_LEFT
    ELSE
        Press Keys    css:body    ARROW_RIGHT
    END
    Wait Until Cell Is Not Active    ${index}    1s
    IF    ${expect.__len__()}
        Wait Until Element Contains    css:${JLAB CSS ACTIVE CELL}    ${expect}
    END
    Resume Screenshots
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
    [Teardown]    Resume Screenshots

Back Up Deck With Keyboard
    [Documentation]    Go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Advance Notebook Deck With Space    ${screenshot}    ${expect}    backup=${TRUE}

Really Advance Notebook Deck With Space
    [Documentation]    REALLY go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Advance Notebook Deck With Space    ${screenshot}    ${expect}    ${backup}

Really Back Up Deck With Space
    [Documentation]    REALLY go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Really Advance Notebook Deck With Space    ${screenshot}    ${expect}    backup=${TRUE}

Really Move Forward Deck With Arrow
    [Documentation]    REALLY go to back or forward slide with arrow, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Back Or Forward Notebook Deck With Arrows    ${screenshot}    ${expect}    ${backup}

Really Move Back Deck With Arrow
    [Documentation]    REALLY go to back slide with arrow, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Really Move Forward Deck With Arrow    ${screenshot}    ${expect}    backup=${TRUE}
