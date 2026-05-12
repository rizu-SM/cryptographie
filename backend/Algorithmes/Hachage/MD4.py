import struct


def _left_rotate(value, shift):
    value &= 0xFFFFFFFF
    return ((value << shift) | (value >> (32 - shift))) & 0xFFFFFFFF


def _f(x, y, z):
    return (x & y) | (~x & z)


def _g(x, y, z):
    return (x & y) | (x & z) | (y & z)


def _h(x, y, z):
    return x ^ y ^ z


def md4_hash(text):
    if not isinstance(text, str):
        raise ValueError("Le texte doit etre une chaine de caracteres")

    message = bytearray(text.encode("utf-8"))
    bit_length = (8 * len(message)) & 0xFFFFFFFFFFFFFFFF

    message.append(0x80)
    while len(message) % 64 != 56:
        message.append(0)
    message += struct.pack("<Q", bit_length)

    a = 0x67452301
    b = 0xEFCDAB89
    c = 0x98BADCFE
    d = 0x10325476

    for offset in range(0, len(message), 64):
        x = list(struct.unpack("<16I", message[offset:offset + 64]))
        aa, bb, cc, dd = a, b, c, d

        shifts = (3, 7, 11, 19)
        for i in range(16):
            k = i
            if i % 4 == 0:
                a = _left_rotate((a + _f(b, c, d) + x[k]), shifts[i % 4])
            elif i % 4 == 1:
                d = _left_rotate((d + _f(a, b, c) + x[k]), shifts[i % 4])
            elif i % 4 == 2:
                c = _left_rotate((c + _f(d, a, b) + x[k]), shifts[i % 4])
            else:
                b = _left_rotate((b + _f(c, d, a) + x[k]), shifts[i % 4])

        shifts = (3, 5, 9, 13)
        order = (0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15)
        for i in range(16):
            k = order[i]
            if i % 4 == 0:
                a = _left_rotate((a + _g(b, c, d) + x[k] + 0x5A827999), shifts[i % 4])
            elif i % 4 == 1:
                d = _left_rotate((d + _g(a, b, c) + x[k] + 0x5A827999), shifts[i % 4])
            elif i % 4 == 2:
                c = _left_rotate((c + _g(d, a, b) + x[k] + 0x5A827999), shifts[i % 4])
            else:
                b = _left_rotate((b + _g(c, d, a) + x[k] + 0x5A827999), shifts[i % 4])

        shifts = (3, 9, 11, 15)
        order = (0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15)
        for i in range(16):
            k = order[i]
            if i % 4 == 0:
                a = _left_rotate((a + _h(b, c, d) + x[k] + 0x6ED9EBA1), shifts[i % 4])
            elif i % 4 == 1:
                d = _left_rotate((d + _h(a, b, c) + x[k] + 0x6ED9EBA1), shifts[i % 4])
            elif i % 4 == 2:
                c = _left_rotate((c + _h(d, a, b) + x[k] + 0x6ED9EBA1), shifts[i % 4])
            else:
                b = _left_rotate((b + _h(c, d, a) + x[k] + 0x6ED9EBA1), shifts[i % 4])

        a = (a + aa) & 0xFFFFFFFF
        b = (b + bb) & 0xFFFFFFFF
        c = (c + cc) & 0xFFFFFFFF
        d = (d + dd) & 0xFFFFFFFF

    return struct.pack("<4I", a, b, c, d).hex()

