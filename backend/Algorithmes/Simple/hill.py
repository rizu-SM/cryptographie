# algorithms/hill.py

def text_to_numbers(text):
    return [ord(c.lower()) - ord('a') for c in text if c.isalpha()]


def numbers_to_text(nums):
    return ''.join(chr(n + ord('a')) for n in nums)


def chunk_text(nums, size):
    # padding avec 'x' si nécessaire
    while len(nums) % size != 0:
        nums.append(ord('x') - ord('a'))
    return [nums[i:i+size] for i in range(0, len(nums), size)]


def multiply_matrix_vector(matrix, vector):
    result = []
    for row in matrix:
        val = sum(row[i] * vector[i] for i in range(len(vector))) % 26
        result.append(val)
    return result


# ------------------------
# Inverse modulaire
# ------------------------

def mod_inverse(a, m):
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    raise ValueError("No modular inverse exists")


def determinant_2x2(matrix):
    return matrix[0][0]*matrix[1][1] - matrix[0][1]*matrix[1][0]


def matrix_inverse_2x2(matrix):
    det = determinant_2x2(matrix) % 26
    inv_det = mod_inverse(det, 26)

    a, b = matrix[0]
    c, d = matrix[1]

    # matrice adjointe
    adj = [
        [d, -b],
        [-c, a]
    ]

    # appliquer inv_det et mod 26
    inv_matrix = []
    for row in adj:
        inv_row = [(inv_det * val) % 26 for val in row]
        inv_matrix.append(inv_row)

    return inv_matrix


# ------------------------
# Encrypt
# ------------------------

def hill_encrypt(text: str, key_matrix: list) -> str:
    nums = text_to_numbers(text)
    chunks = chunk_text(nums, len(key_matrix))

    result = []
    for chunk in chunks:
        result.extend(multiply_matrix_vector(key_matrix, chunk))

    return numbers_to_text(result)


# ------------------------
# Decrypt
# ------------------------

def hill_decrypt(ciphertext: str, key_matrix: list) -> str:
    inv_matrix = matrix_inverse_2x2(key_matrix)

    nums = text_to_numbers(ciphertext)
    chunks = chunk_text(nums, len(inv_matrix))

    result = []
    for chunk in chunks:
        result.extend(multiply_matrix_vector(inv_matrix, chunk))

    return numbers_to_text(result)