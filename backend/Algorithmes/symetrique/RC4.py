def rc4_encrypt(key: str, data: str) -> str:
    # convertir en bytes
    key = [ord(c) for c in key]
    data = [ord(c) for c in data]

    # ------------------------
    # KSA
    # ------------------------
    S = list(range(256))
    j = 0

    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]

    # ------------------------
    # PRGA
    # ------------------------
    i = 0
    j = 0
    keystream = []

    for _ in range(len(data)):
        i = (i + 1) % 256
        j = (j + S[i]) % 256

        S[i], S[j] = S[j], S[i]

        k = S[(S[i] + S[j]) % 256]
        keystream.append(k)

    # ------------------------
    # XOR
    # ------------------------
    result = []
    for d, k in zip(data, keystream):
        result.append(d ^ k)

    # convertir en texte (hex pour lisibilité)
    return ''.join(format(x, '02x') for x in result)


def rc4_decrypt(key: str, ciphertext_hex: str) -> str:
    # convertir hex → bytes
    data = [int(ciphertext_hex[i:i+2], 16) for i in range(0, len(ciphertext_hex), 2)]

    key = [ord(c) for c in key]

    # KSA
    S = list(range(256))
    j = 0

    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]

    # PRGA
    i = 0
    j = 0
    keystream = []

    for _ in range(len(data)):
        i = (i + 1) % 256
        j = (j + S[i]) % 256

        S[i], S[j] = S[j], S[i]

        k = S[(S[i] + S[j]) % 256]
        keystream.append(k)

    # XOR
    result = []
    for d, k in zip(data, keystream):
        result.append(d ^ k)

    return ''.join(chr(x) for x in result)