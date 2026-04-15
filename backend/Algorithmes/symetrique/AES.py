import os

# -------------------- 1. S-BOX --------------------
S_BOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

INV_S_BOX = [0] * 256
for i, v in enumerate(S_BOX):
    INV_S_BOX[v] = i

RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36]

# -------------------- UTIL GF(2^8) --------------------
def gmul(a, b):
    p = 0
    for _ in range(8):
        if b & 1:
            p ^= a
        hi = a & 0x80
        a = (a << 1) & 0xFF
        if hi:
            a ^= 0x1B
        b >>= 1
    return p

# -------------------- STATE CORRECT (COLUMN-MAJOR) --------------------
def bytes_to_state(block):
    return [[block[r + 4*c] for r in range(4)] for c in range(4)]

def state_to_bytes(state):
    return bytes([state[c][r] for c in range(4) for r in range(4)])

# -------------------- AES STEPS --------------------
def sub_bytes(state, inv=False):
    box = INV_S_BOX if inv else S_BOX
    for c in range(4):
        for r in range(4):
            state[c][r] = box[state[c][r]]

def shift_rows(state, inv=False):
    for r in range(4):
        row = [state[c][r] for c in range(4)]
        shift = r if not inv else (4 - r) % 4
        row = row[shift:] + row[:shift]
        for c in range(4):
            state[c][r] = row[c]

def mix_columns(state, inv=False):
    for c in range(4):
        a = state[c][:]
        if not inv:
            state[c][0] = gmul(a[0],2) ^ gmul(a[1],3) ^ a[2] ^ a[3]
            state[c][1] = a[0] ^ gmul(a[1],2) ^ gmul(a[2],3) ^ a[3]
            state[c][2] = a[0] ^ a[1] ^ gmul(a[2],2) ^ gmul(a[3],3)
            state[c][3] = gmul(a[0],3) ^ a[1] ^ a[2] ^ gmul(a[3],2)
        else:
            state[c][0] = gmul(a[0],14)^gmul(a[1],11)^gmul(a[2],13)^gmul(a[3],9)
            state[c][1] = gmul(a[0],9)^gmul(a[1],14)^gmul(a[2],11)^gmul(a[3],13)
            state[c][2] = gmul(a[0],13)^gmul(a[1],9)^gmul(a[2],14)^gmul(a[3],11)
            state[c][3] = gmul(a[0],11)^gmul(a[1],13)^gmul(a[2],9)^gmul(a[3],14)

def add_round_key(state, key):
    for c in range(4):
        for r in range(4):
            state[c][r] ^= key[c][r]

# -------------------- KEY EXPANSION --------------------
def key_expansion(key):
    Nk = len(key)//4
    Nr = {4:10, 6:12, 8:14}[Nk]

    words = [list(key[i:i+4]) for i in range(0, len(key), 4)]

    for i in range(Nk, 4*(Nr+1)):
        temp = words[i-1][:]
        if i % Nk == 0:
            temp = temp[1:] + temp[:1]
            temp = [S_BOX[b] for b in temp]
            temp[0] ^= RCON[(i//Nk)-1]
        elif Nk > 6 and i % Nk == 4:
            temp = [S_BOX[b] for b in temp]

        words.append([words[i-Nk][j] ^ temp[j] for j in range(4)])

    return [words[i:i+4] for i in range(0, len(words), 4)]

# -------------------- ENCRYPTION --------------------
def encrypt_block(block, key):
    Nr = {16:10, 24:12, 32:14}[len(key)]
    round_keys = key_expansion(key)

    state = bytes_to_state(block)

    add_round_key(state, round_keys[0])

    for r in range(1, Nr):
        sub_bytes(state)
        shift_rows(state)
        mix_columns(state)
        add_round_key(state, round_keys[r])

    sub_bytes(state)
    shift_rows(state)
    add_round_key(state, round_keys[Nr])

    return state_to_bytes(state)

# -------------------- DECRYPTION --------------------
def decrypt_block(block, key):
    Nr = {16:10, 24:12, 32:14}[len(key)]
    round_keys = key_expansion(key)

    state = bytes_to_state(block)

    add_round_key(state, round_keys[Nr])
    shift_rows(state, inv=True)
    sub_bytes(state, inv=True)

    for r in range(Nr-1, 0, -1):
        add_round_key(state, round_keys[r])
        mix_columns(state, inv=True)
        shift_rows(state, inv=True)
        sub_bytes(state, inv=True)

    add_round_key(state, round_keys[0])

    return state_to_bytes(state)

# -------------------- PADDING --------------------
def pad(data):
    pad_len = 16 - (len(data) % 16)
    return data + bytes([pad_len]*pad_len)

def unpad(data):
    pad_len = data[-1]
    if data[-pad_len:] != bytes([pad_len]*pad_len):
        raise ValueError("Invalid padding")
    return data[:-pad_len]

# -------------------- CBC MODE --------------------
def aes_encrypt(msg, key):
    iv = os.urandom(16)
    msg = pad(msg)

    prev = iv
    out = b""

    for i in range(0, len(msg), 16):
        block = bytes(x ^ y for x, y in zip(msg[i:i+16], prev))
        enc = encrypt_block(block, key)
        out += enc
        prev = enc

    return iv + out

def aes_decrypt(cipher, key):
    iv, data = cipher[:16], cipher[16:]

    prev = iv
    out = b""

    for i in range(0, len(data), 16):
        block = data[i:i+16]
        dec = decrypt_block(block, key)
        out += bytes(x ^ y for x, y in zip(dec, prev))
        prev = block

    return unpad(out)

# -------------------- TEST --------------------
if __name__ == "__main__":
    key = b"1234567890ABCDEF1234567890ABCDEF"
    msg = b"Hello AES secure implementation!"

    cipher = aes_encrypt(msg, key)
    print("Cipher:", cipher.hex())

    plain = aes_decrypt(cipher, key)
    print("Plain:", plain.decode())
