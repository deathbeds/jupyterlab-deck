*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./DeckSelectors.resource


*** Variables ***
${ZERO_PAD}     {0:03d}


*** Keywords ***
Start Deck With Notebook Toolbar Button
    [Documentation]    Use the notebook toolbar to start deck.
    Wait Until Element Is Not Visible    css:${CSS_LAB_SPINNER}
    Click Element    css:${CSS_DECK_NOTEBOOK_BUTTON}
    Wait Until Element Is Visible    css:${CSS_DECK_PRESENTING}
    Wait Until Element Is Visible    css:${CSS_DECK_VISIBLE}

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
            ${els} =    Get WebElements    css:${sel}:not(${CSS_LAB_DISABLED})
            IF    ${els.__len__()}
                ${keep_going} =    Set Variable    ${TRUE}
                Advance Slide And Screenshot    ${els[0]}    ${prefix}    ${i}    ${direction}
                BREAK
            END
        END
    END
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i.__add__(1)})}-FIN.png

Advance Slide And Screenshot
    [Documentation]    Advance a direction, wait a bit, and take a screenshot.
    [Arguments]    ${element}    ${prefix}    ${i}    ${suffix}
    Click Element    ${element}
    Sleep    0.1s
    Capture Page Screenshot    ${prefix}-${ZERO_PAD.format(${i})}-${suffix}.png
