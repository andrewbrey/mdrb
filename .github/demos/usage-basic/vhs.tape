Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "GruvboxDark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb demo.md --mode isolated"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "mdrb demo.md"
Enter
Sleep 1s

Type "y"
Sleep 500ms
Enter
Sleep 1s

Type "y"
Sleep 500ms
Enter
Sleep 1s

Type "y"
Sleep 500ms
Enter
Sleep 1s

Sleep 3s