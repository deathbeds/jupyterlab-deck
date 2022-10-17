*** Settings ***
Documentation       Tests for JupyterLab.

Library             JupyterLibrary

Suite Setup         Wait For New Jupyter Server To Be Ready
Suite Teardown      Terminate All Jupyter Servers
Test Teardown       Reset JupyterLab And Close

Force Tags          app:lab
