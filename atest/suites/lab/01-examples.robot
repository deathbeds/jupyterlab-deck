*** Settings ***
Documentation       The examples work.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Fixtures.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Screenshots.resource

Suite Setup         Set Up Example Suite
Suite Teardown      Clean Examples

Force Tags          suite:examples


*** Test Cases ***
The Example Can Be Navigated
    [Documentation]    All slides and fragments are reachable.
    [Template]    Visit All Example Slides And Fragments
    ${README_IPYNB}
    ${README_MD}
    ${HISTORY_IPYNB}
    ${LAYERS_IPYNB}


*** Keywords ***
Visit All Example Slides And Fragments
    [Documentation]    The given file in `examples` operates as expected.
    [Arguments]    ${example}=README.ipynb
    ${stem} =    Set Variable    ${example.lower().replace(" ", "_")}
    Open Example    ${example}
    Capture Page Screenshot    ${stem}-00-before-deck.png
    IF    ${example.endswith('.ipynb')}
        Really Start Deck With Notebook Toolbar Button
    ELSE
        Execute JupyterLab Command    Start Deck
    END
    Capture Page Screenshot    ${stem}-01-deck.png
    Visit Slides And Fragments With Remote    ${stem}-02-walk
    Stop Deck With Remote
    Capture Page Screenshot    ${stem}-03-after-deck.png
    [Teardown]    Reset Example Test

Set Up Example Suite
    [Documentation]    Prepare for this suite.
    Set Attempt Screenshot Directory    lab${/}examples
    Copy Examples

Reset Example Test
    [Documentation]    Clean up after each test.
    Maybe Open JupyterLab Sidebar    Commands
    Execute JupyterLab Command    Close All Tabs
