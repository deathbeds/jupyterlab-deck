*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Library             Collections
Library             JupyterLibrary


*** Keywords ***
Add And Activate Cell With Keyboard
    [Documentation]    Add a cell with the keyboard.
    ${index} =    Get Active Cell Index
    Enter Command Mode
    Press Keys    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})    b
    Wait Until Cell Is Not Active    ${index}
    Sleep    0.2s

Enter Command Mode
    [Documentation]    Activate command mode.
    Press Keys    css:body    ESCAPE
    Wait Until Page Does Not Contain Element    css:${CSS_LAB_MOD_EDIT}    timeout=1s
    Wait Until Page Contains Element    css:${CSS_LAB_MOD_CMD}    timeout=1s
    Press Keys    css:body    ESCAPE
    Sleep    0.2s

Set Cell Type With Keyboard
    [Documentation]    Use the keyboard to change the cell type.
    [Arguments]    ${index}    ${type}
    Enter Command Mode
    IF    '${type}' == 'code'
        ${keys}    ${sel} =    Set Variable    y    ${CSS_LAB_CELL_CODE}
    ELSE IF    '${type}' == 'markdown'
        ${keys}    ${sel} =    Set Variable    m    ${CSS_LAB_CELL_MARKDOWN}
    ELSE IF    '${type}' == 'raw'
        ${keys}    ${sel} =    Set Variable    r    ${CSS_LAB_CELL_RAW}
    END
    Press Keys    css:body    ${keys}
    Wait Until Page Contains Element
    ...    css:${JLAB CSS ACTIVE DOC CELLS}:nth-child(${index})${sel}

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
    Wait Until Keyword Succeeds    5x    0.1s
    ...    Set Cell Type With Keyboard    ${index}    markdown
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
        Wait Until Page Contains Element    ${sel}${CSS_LAB_MOD_RENDERED}    timeout=1s
    END

Get Active Cell Index
    [Documentation]    Get the 1-indexed position of the active cell.
    ${cells} =    Get WebElements    css:${JLAB CSS ACTIVE DOC CELLS}
    ${active} =    Get WebElement    css:${JLAB CSS ACTIVE CELL}
    ${index} =    Get Index From List    ${cells}    ${active}
    RETURN    ${index.__add__(1)}

Wait Until Cell Is Not Active
    [Documentation]    Wait until the given cell is not active.
    [Arguments]    ${index}
    Wait Until Page Does Not Contain Element    css:${JLAB CSS ACTIVE CELL}:nth-child(${index})
