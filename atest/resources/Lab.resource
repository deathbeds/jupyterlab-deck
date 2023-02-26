*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Resource            ./Screenshots.resource
Library             Collections
Library             JupyterLibrary


*** Keywords ***
Add And Activate Cell With Keyboard
    [Documentation]    Add a cell with the keyboard.
    ${index} =    Get Active Cell Index
    Enter Command Mode
    Press Keys    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})    b
    Wait Until Cell Is Not Active    ${index}    1s
    Sleep    0.2s

Enter Command Mode
    [Documentation]    Activate command mode.
    Press Keys    css:body    ESCAPE
    Wait Until Page Does Not Contain Element    css:${CSS_LAB_MOD_EDIT}    timeout=1s
    Wait Until Element Is Visible    css:${CSS_LAB_MOD_CMD}    timeout=1s
    Press Keys    css:body    ESCAPE
    Sleep    0.2s

Set Cell Type
    [Documentation]    Use the command to change the cell type.
    [Arguments]    ${index}    ${type}    ${timeout}=5s
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    Mouse Over    css:${CSS_LAB_NB_TOOLBAR}
    Wait Until Element Is Visible    css:${CSS_LAB_NB_TOOLBAR_CELLTYPE}
    Select From List By Label    css:${CSS_LAB_NB_TOOLBAR_CELLTYPE}    ${type.title()}
    Click Element    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    ${sel} =    Get From Dictionary    ${CSS_LAB_CELL_TYPE}    ${type}
    Wait Until Element Is Visible
    ...    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})${sel}
    ...    timeout=${timeout}

Make Markdown Cell
    [Documentation]    Turn the current cell into markdown.
    [Arguments]    ${code}    ${expect}=${EMPTY}    ${new}=${TRUE}    ${screenshot}=${EMPTY}
    ${index} =    Get Active Cell Index
    IF    ${new}
        Add And Activate Cell With Keyboard
        ${index} =    Set Variable    ${index.__add__(1)}
    END
    ${cm} =    Set Variable    ${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index}) .CodeMirror
    Set CodeMirror Value    ${cm}    ${code}
    Set Cell Type    ${index}    markdown
    IF    ${expect.__len__()}    Render Markdown Cell    ${index}    ${expect}
    IF    ${screenshot.__len__()}    Capture Page Screenshot    ${screenshot}

Render Markdown Cell
    [Documentation]    Render the current cell.
    [Arguments]    ${index}    ${expect}=${EMPTY}
    ${sel} =    Set Variable    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})
    Click Element    ${sel}
    ${accel} =    Get ACCEL Key
    Press Keys    ${sel}    ${accel}+ENTER
    IF    ${expect.__len__()}
        Wait Until Element Contains    ${sel}${CSS_LAB_MOD_RENDERED}    ${expect}    timeout=1s
    ELSE
        Wait Until Element Is Visible    ${sel}${CSS_LAB_MOD_RENDERED}    timeout=1s
    END

Get Active Cell Index
    [Documentation]    Get the 1-indexed position of the active cell.
    ${cells} =    Get WebElements    css:${JLAB CSS ACTIVE DOC CELLS}
    ${active} =    Get WebElement    css:${JLAB CSS ACTIVE CELL}
    ${index} =    Get Index From List    ${cells}    ${active}
    RETURN    ${index.__add__(1)}

Wait Until Cell Is Not Active
    [Documentation]    Wait until the given cell is not active.
    [Arguments]    ${index}    ${timeout}=1s
    Wait Until Page Does Not Contain Element    css:${JLAB CSS ACTIVE CELL}:nth-child(${index})    timeout=${timeout}

Maybe Open Cell Metadata JSON
    [Documentation]    Ensure the Cell Metadata viewer is open.
    Wait Until Element Is Visible    css:${CSS_LAB_ADVANCED_HEADER}
    Capture Page Screenshot
    ${el} =    Get WebElements    css:${CSS_LAB_ADVANCED_EXPAND}

    IF    ${el.__len__()}    Click Element    css:${CSS_LAB_ADVANCED_EXPAND}
    Maybe Open JupyterLab Sidebar    Property Inspector
    Wait Until Element Is Visible    css:${CSS_LAB_CELL_META_JSON_CM}

Wait Until Cell Metadata Contains
    [Documentation]    Ensure a string appears in the Cell Metadata JSON
    [Arguments]    ${text}    ${attempts}=5    ${timeout}=0.1s    ${inverse}=${FALSE}
    ${ok} =    Set Variable    ${FALSE}
    FOR    ${i}    IN RANGE    ${attempts}
        ${src} =    Return CodeMirror Method    ${CSS_LAB_CELL_META_JSON_CM}    getValue()
        ${contains} =    Set Variable    ${src.__contains__('''${text}''')}
        IF    ${inverse} and not ${contains}
            ${ok} =    Set Variable    ${TRUE}
            BREAK
        ELSE IF    not ${inverse} and ${contains}
            ${ok} =    Set Variable    ${TRUE}
            BREAK
        END
        Sleep    ${timeout}
    END

    IF    not ${ok}    Capture Page Screenshot

    Should Be True    ${ok}

Wait Until Cell Metadata Does Not Contain
    [Documentation]    Ensure a string does _not_ appear in the Cell Metadata JSON
    [Arguments]    ${text}    ${attempts}=5    ${timeout}=0.1s
    Wait Until Cell Metadata Contains    text=${text}    attempts=${attempts}    timeout=${timeout}    inverse=${TRUE}

Return CodeMirror Method
    [Documentation]    Construct and a method call against in the CodeMirror attached to the element
    ...    that matches a ``css`` selector with the given ``js`` code.
    [Arguments]    ${css}    ${js}
    ${result} =    Execute JavaScript    return document.querySelector(`${css}`).CodeMirror.${js}
    RETURN    ${result}
