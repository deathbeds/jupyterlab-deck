*** Settings ***
Documentation       Keywords for working with CodeMirror

Library             JupyterLibrary


*** Keywords ***
Initialize CodeMirror
    [Documentation]    Fix apparently-broken CSS/JS variable updates.
    Update Globals For JupyterLab 4
    Set Suite Variable    ${CM CSS EDITOR}    ${CM CSS EDITOR}    children=${TRUE}
    Set Suite Variable    ${CM JS INSTANCE}    ${CM JS INSTANCE}    children=${TRUE}

Return CodeMirror Method
    [Documentation]    Construct and a method call against in the CodeMirror attached to the element
    ...    that matches a ``css`` selector with the given ``js`` code.
    ...    The CodeMirror editor instance will be available as `cm`.
    [Arguments]    ${css}    ${js}
    ${result} =    Execute JavaScript
    ...    return (() => {
    ...    const cm = document.querySelector(`${css}`)${CM JS INSTANCE};
    ...    return cm.${js};
    ...    }).call(this);
    RETURN    ${result}
