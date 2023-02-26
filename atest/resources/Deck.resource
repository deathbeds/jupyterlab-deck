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
    ${already_visible} =    Get WebElements    css:${CSS_DECK_VISIBLE}
    IF    not ${already_visible.__len__()}
        Wait Until Element Is Not Visible    css:${CSS_LAB_SPINNER}    timeout=1s
        Click Element    css:${JLAB CSS ACTIVE DOC}
        Wait Until Element Is Visible    css:${CSS_DECK_NOTEBOOK_BUTTON}
        Mouse Over    css:${CSS_DECK_NOTEBOOK_BUTTON}
        Click Element    css:${CSS_DECK_NOTEBOOK_BUTTON}
        Wait Until Element Is Visible    css:${CSS_DECK_PRESENTING}    timeout=1s
        Wait Until Element Is Visible    css:${CSS_DECK_VISIBLE}    timeout=1s
    END

Really Start Deck With Notebook Toolbar Button
    [Documentation]    REALLY use the notebook toolbar to start deck.
    Wait Until Keyword Succeeds    5x    0.1s    Start Deck With Notebook Toolbar Button

Start Markdown Deck From Editor
    [Documentation]    Start a deck from a markdown editor with the context menu.
    [Arguments]    ${host}
    Select From Context Menu    ${CSS_LAB_EDITOR}    li${CSS_LAB_CMD_MARKDOWN_PREVIEW}
    Close JupyterLab Dock Panel Tab    ${host}
    Close JupyterLab Dock Panel Tab    Launcher
    Click Element    css:${CSS_LAB_MARKDOWN_VIEWER}
    Execute JupyterLab Command    Start Deck
    Wait Until Element Is Visible    css:${CSS_DECK}
    Click Element    css:${CSS_DECK}

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
    Sleep    0.2s
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
    Sleep    0.2s
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}
    Click Element    css:${CSS_DECK_DIR_STACK} button
    Sleep    0.2s

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

Advance Notebook Deck With Keyboard
    [Documentation]    Go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    ${index} =    Get Active Cell Index
    # Send Error Screenshots To Trash
    Ensure Cell Is Interactable
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
    Ensure Cell Is Interactable
    [Teardown]    Resume Screenshots

Ensure Cell Is Interactable
    [Documentation]    Some checks to improve success rate of keyboard
    ${searchable} =    Get WebElements    .jp-NotebookPanel.jp-mod-searchable
    IF    not ${searchable.__len__()}
        Click Element    css:${JLAB CSS ACTIVE DOC}
    END
    Mouse Over    css:${JLAB CSS ACTIVE CELL}

Back Up Deck With Keyboard
    [Documentation]    Go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Advance Notebook Deck With Keyboard    ${screenshot}    ${expect}    backup=${TRUE}

Really Advance Notebook Deck With Keyboard
    [Documentation]    REALLY go to the down/forward slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}    ${backup}=${FALSE}
    Wait Until Keyword Succeeds    5x    0.5s
    ...    Advance Notebook Deck With Keyboard    ${screenshot}    ${expect}    ${backup}

Really Back Up Deck With Keyboard
    [Documentation]    REALLY go to the up/back slide with space, wait a bit, then screenshot.
    [Arguments]    ${screenshot}=${EMPTY}    ${expect}=${EMPTY}
    Really Advance Notebook Deck With Keyboard    ${screenshot}    ${expect}    backup=${TRUE}

Prepare Command Palette For Slide Type
    [Documentation]    Ensure the command palette is open and filtered
    Maybe Open JupyterLab Sidebar    Commands
    Input Text    css:${JLAB CSS CMD INPUT}    Slide Type

Select Slide Type By Click
    [Documentation]    Use the pre-filtered command palette to change slide type
    [Arguments]    ${slide_type}
    ${sel} =    Set Variable
    ...    .lm-TabBar-tab:not(.lm-mod-current)[title^\="Commands"]
    ${needs_sidebar} =    Get WebElements    css:${sel}
    IF    ${needs_sidebar.__len__()}    Click Element    css:${sel}
    ${sel} =    Set Variable
    ...    css:${CSS_LAB_CMD_PALETTE_CONTENT} [data-icon\="deck:slide-${slide_type}"]
    Wait Until Element Is Visible    ${sel}
    Click Element    ${sel}
    Sleep    0.2s

Slide Types Should Be
    [Documentation]    Verify a notebooks slide types
    [Arguments]    ${screenshot}    ${notebook}    @{slide_types}
    Execute JupyterLab Command    Save Notebook
    # Prepare Command Palette For Slide Type
    Sleep    0.2s
    ${nb} =    Get JSON File    ${notebook}
    ${observed} =    Create List
    FOR    ${i}    ${cell}    IN ENUMERATE    @{nb["cells"]}
        ${slide_type} =    Get Cell Slide Type    ${cell}
        Append To List    ${observed}    ${slide_type}
    END
    Capture Page Screenshot    ${screenshot}
    Lists Should Be Equal    ${observed}    ${slide_types}

Get Cell Slide Type
    [Documentation]    Get the slide type of a cell
    [Arguments]    ${cell}
    ${slide_type} =    Set Variable    ${cell["metadata"].get("slideshow", {}).get("slide_type", "null")}
    RETURN    ${slide_type}

Get JSON File
    [Documentation]    Load a JSON file
    [Arguments]    ${path}
    ${text} =    Get File    ${path}
    ${data} =    Loads    ${text}
    RETURN    ${data}

Select Multiple Cells
    [Documentation]    Create a contiguous multiselection.
    [Arguments]    @{cell_indices}
    FOR    ${i}    ${cell}    IN ENUMERATE    @{cell_indices}
        ${sel} =    Set Variable    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${cell}) ${CSS_LAB_INPUT_PROMPT}
        Mouse Over    ${sel}
        IF    ${i} == 0
            Click Element    ${sel}
        ELSE
            Click Element    ${sel}    SHIFT
        END
    END

    IF    ${cell_indices.__len__()} == 1
        Wait Until Page Does Not Contain    css:${CSS_LAB_MOD_MULTISELECT}
    ELSE
        Wait Until Element Is Visible
        ...    css:${JLAB CSS ACTIVE DOC CELLS}${CSS_LAB_MOD_MULTISELECT}:nth-child(${cell_indices[-1]})
    END
