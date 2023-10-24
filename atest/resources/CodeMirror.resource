*** Settings ***
Documentation       Keywords for working with CodeMirror

Library             JupyterLibrary


*** Variables ***
${CM JS TO STRING}      view.state.doc.toString()


*** Keywords ***
Initialize CodeMirror
    [Documentation]    Fix apparently-broken CSS/JS variable updates.
    IF    "${JD_APP_UNDER_TEST}" == "nb"
        Update Globals For JupyterLab 4
    ELSE
        Update Globals For JupyterLab Version
    END
    Set Suite Variable    ${CM CSS EDITOR}    ${CM CSS EDITOR}    children=${TRUE}
    Set Suite Variable    ${CM JS INSTANCE}    ${CM JS INSTANCE}    children=${TRUE}
    IF    "${CM JS INSTANCE}" == "${CM6 JS INSTANCE}"
        Set Suite Variable    ${CM JS TO STRING}    view.state.doc.toString()    children=${TRUE}
    ELSE
        Set Suite Variable    ${CM JS TO STRING}    getValue()    children=${TRUE}
    END

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
