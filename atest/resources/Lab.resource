*** Settings ***
Documentation       Keywords for working with decks.

Resource            ./LabSelectors.resource
Library             JupyterLibrary


*** Keywords ***
Add And Activate Cell With Keyboard
    [Documentation]    Add a cell with the keyboard.
    Click Element    css:${JLAB CSS ACTIVE DOC}
    Enter Command Mode
    Press Keys    css:${JLAB CSS ACTIVE DOC}    b
    Sleep    0.1s

Enter Command Mode
    [Documentation]    Activate command mode.
    Press Keys    css:body    ESCAPE
    Wait Until Page Does Not Contain Element    css:${CSS_LAB_MOD_EDIT}    timeout=1s
    Wait Until Page Contains Element    css:${CSS_LAB_MOD_CMD}    timeout=1s
    Sleep    0.2s
    Press Keys    css:body    ESCAPE

Make Current Cell Type With Keyboard
    [Documentation]    Use the keyboard to change the cell type.
    [Arguments]    ${type}
    Enter Command Mode
    Click Element    css:${JLAB CSS ACTIVE DOC}
    IF    '${type}' == 'code'
        ${keys}    ${sel} =    Set Variable    y    ${CSS_LAB_CELL_CODE}
    ELSE IF    '${type}' == 'markdown'
        ${keys}    ${sel} =    Set Variable    m    ${CSS_LAB_CELL_MARKDOWN}
    ELSE IF    '${type}' == 'raw'
        ${keys}    ${sel} =    Set Variable    r    ${CSS_LAB_CELL_RAW}
    END
    Press Keys    css:body    ${keys}
    Sleep    0.1s
    Wait Until Page Contains Element    css:${JLAB CSS ACTIVE CELL}${sel}

Make Markdown Cell
    [Documentation]    Turn the current cell into markdown.
    [Arguments]    ${code}    ${render}=${TRUE}    ${new}=${TRUE}
    IF    ${new}    Add And Activate Cell With Keyboard
    ${cm} =    Set Variable    ${JLAB CSS ACTIVE CELL} .CodeMirror
    Set CodeMirror Value    ${cm}    ${code}
    Make Current Cell Type With Keyboard    markdown
    IF    ${render}    Render Current Markdown Cell

Render Current Markdown Cell
    [Documentation]    Render the current cell.
    Click Element    css:${JLAB CSS ACTIVE CELL}
    ${accel} =    Get ACCEL Key
    Press Keys    css:${JLAB CSS ACTIVE CELL}    ${accel}+ENTER
    Wait Until Page Contains Element    css:${JLAB CSS ACTIVE CELL}${CSS_LAB_MOD_RENDERED}    timeout=1s
