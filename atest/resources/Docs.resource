*** Settings ***
Documentation       Keywords for interactive tests

Library             OperatingSystem
Library             JupyterLibrary
Resource            ./Coverage.resource
Resource            ./Deck.resource
Resource            ./Lab.resource
Resource            ./Fixtures.resource
Resource            ./Screenshots.resource


*** Variables ***
${NEXT_NB}      ${0}


*** Keywords ***
Start Basic Notebook
    [Documentation]    Start a non-deck notebook
    [Arguments]    ${fixture}=Empty    ${path}=
    Execute JupyterLab Command    Close All Tabs
    ${jdir} =    Get Jupyter Directory
    ${test} =    Set Variable    Test-${NEXT_NB}.ipynb
    Set Suite Variable    ${NEXT_NB}    ${NEXT_NB.__add__(1)}
    Copy File    ${FIXTURES}${/}${fixture}.ipynb    ${jdir}${/}${test}
    Refresh File List
    Open Example    ${test}
    RETURN    ${test}

Start Empty Notebook Deck
    [Documentation]    Start an empty deck
    ${nb} =    Start Basic Notebook
    Really Start Deck With Notebook Toolbar Button
    RETURN    ${nb}

Start Basic Notebook Deck
    [Documentation]    Make a few cells
    ${nb} =    Start Basic Notebook    ThreeCells
    Really Start Deck With Notebook Toolbar Button
    RETURN    ${nb}

Start Notebook Deck With Anchors
    [Documentation]    Make a few cells with anchors.
    ${nb} =    Start Basic Notebook    Anchors
    Really Start Deck With Notebook Toolbar Button
    Select A Slide Type    4    subslide    s1-01-new-slide.png
    RETURN    ${nb}

Tear Down Interactive Suite
    [Documentation]    Clean up after this suite.
    Clean Examples
    Execute JupyterLab Command    Close All Tabs

Reset Interactive Test
    [Documentation]    Clean up after each test.
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Save Notebook
    Execute JupyterLab Command    Shut Down All Kernels
    Execute JupyterLab Command    Close All Tabs
    Clean Examples

Set Up Interactive Suite
    [Documentation]    Prepare for this suite.
    [Arguments]    ${screens}
    Set Attempt Screenshot Directory    lab${/}${screens}
    Clean Examples
