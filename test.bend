f = bend x = 0 {
  when (< x 10):
    #
    # fork
    (fork (+ x 1))
  else:
    10
}

main = f
