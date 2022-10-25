*** Settings ***
Documentation       Keywords for interactive tests

Library             OperatingSystem
Library             JupyterLibrary
Resource            ./Coverage.resource
Resource            ./Deck.resource
Resource            ./Lab.resource
Resource            ./Screenshots.resource


*** Keywords ***
Start Empty Notebook Deck
    [Documentation]    Start an empty deck
    Launch A New JupyterLab Document
    Wait Until JupyterLab Kernel Is Idle
    Really Start Deck With Notebook Toolbar Button

Start Basic Notebook Deck
    [Documentation]    Make a few cells
    Start Empty Notebook Deck
    Click Element    css:${JLAB CSS ACTIVE CELL}
    Make Markdown Cell    \# Hello World    Hello World    new=${FALSE}    screenshot=s0-00-hello.png
    Make Markdown Cell    - item1234    item1234    screenshot=s0-01-1234.png
    Make Markdown Cell    - item4567    item4567    screenshot=s0-02-4567.png

Tear Down Interactive Suite
    [Documentation]    Clean up after this suite.
    Execute JupyterLab Command    Close All Tabs

Reset Interactive Test
    [Documentation]    Clean up after each test.
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Save Notebook
    ${nbdir} =    Get Jupyter Directory
    Remove File    Untitled.ipynb
    Execute JupyterLab Command    Close All Tabs

Set Up Interactive Suite
    [Documentation]    Prepare for this suite.
    [Arguments]    ${screens}
    Set Attempt Screenshot Directory    lab${/}${screens}
