Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "GruvboxDark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb https://raw.githubusercontent.com/andrewbrey/mdrb/refs/heads/main/demo.md --mode isolated"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "mdrb https://raw.githubusercontent.com/andrewbrey/mdrb/refs/heads/main/demo.md --mode isolated"
Enter
Sleep 5s
