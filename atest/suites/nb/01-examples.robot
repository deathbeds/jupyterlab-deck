*** Settings ***
Documentation       The examples work in Notebook.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Fixtures.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Screenshots.resource

Suite Setup         Set Up Example Suite
Suite Teardown      Clean Examples

Force Tags          suite:examples


*** Test Cases ***
The README Markdown Can Be Navigated
    [Documentation]    All slides and fragments are reachable.
    [Tags]    activity:markdown
    Visit All Example Slides And Fragments    ${README_MD}
    Execute JupyterLab Command    Start Deck
    Wait Until Element Is Visible    css:${CSS_DECK}
    ${anchors} =    Get WebElements    css:${CSS_LAB_MARKDOWN_VIEWER} a[href\^="#"]
    ${anchors} =    Filter Visible Elements    ${anchors}
    Click Element    ${anchors[0]}
    Capture Page Screenshot    readme.md-10-post-deck-anchor.png
    Press Keys    css:body    SHIFT+SPACE
    Capture Page Screenshot    readme.md-10-post-deck-reverse.png
    [Teardown]    Reset Example Test

The README Notebook Can Be Navigated
    [Documentation]    All slides and fragments are reachable.
    [Tags]    activity:notebook
    Visit All Example Slides And Fragments    ${README_IPYNB}
    [Teardown]    Reset Example Test


*** Keywords ***
Visit All Example Slides And Fragments
    [Documentation]    The given file in `examples` operates as expected.
    [Arguments]    ${example}=README.ipynb
    ${stem} =    Set Variable    ${example.lower().replace(" ", "_")}
    Open Example    ${example}    switch_window=README
    Capture Page Screenshot    ${stem}-00-before-deck.png
    IF    ${example.endswith('.ipynb')} or ${example.endswith('.md')}
        Really Start Deck With Toolbar Button
    ELSE
        Execute JupyterLab Command    Start Deck
    END
    Capture Page Screenshot    ${stem}-01-deck.png
    Visit Slides And Fragments With Remote    ${example}    ${stem}-02-walk
    Stop Deck With Remote
    Capture Page Screenshot    ${stem}-03-after-deck.png

Set Up Example Suite
    [Documentation]    Prepare for this suite.
    Set Attempt Screenshot Directory    lab${/}examples
    Copy Examples

Reset Example Test
    [Documentation]    Clean up after each test.
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Stop Deck
    Execute JupyterLab Command    Save
    Capture Page Coverage
    Switch Window    title:Home
