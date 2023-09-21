cp test/menu_closed.png test/outp_menu_closed.png
cp test/menu_open.png test/outp_menu_open.png

./src/postprocess.py test/outp_menu_closed.png
./src/postprocess.py test/outp_menu_open.png