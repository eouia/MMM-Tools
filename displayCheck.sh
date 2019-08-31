a=$(vcgencmd display_power |  awk -F'=' '{print $2}'); if (($a)); then echo Display On; else echo Display Off; fi
