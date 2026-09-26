Option Explicit

Dim command, shell

If WScript.Arguments.Count = 0 Then
  WScript.Quit 1
End If

command = """" & WScript.Arguments(0) & """"

Set shell = CreateObject("WScript.Shell")
WScript.Quit shell.Run(command, 0, True)
