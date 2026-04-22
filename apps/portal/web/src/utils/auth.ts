/**
 * 密码强度校验（与后端保持一致）
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' }
  }

  const hasEnglish = /[a-zA-Z]/.test(password)
  const hasChinese = /[\u4e00-\u9fa5]/.test(password)
  if (!hasEnglish && !hasChinese) {
    return { valid: false, message: '密码必须包含中文或英文字符' }
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含数字' }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符（如!@#$等）' }
  }

  return { valid: true }
}

/**
 * 获取密码强度等级
 */
export function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-zA-Z]/.test(password) || /[\u4e00-\u9fa5]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  if (score <= 2) return { level: 1, label: '弱', color: 'text-red-500' }
  if (score <= 3) return { level: 2, label: '中', color: 'text-yellow-500' }
  if (score <= 4) return { level: 3, label: '强', color: 'text-blue-500' }
  return { level: 4, label: '很强', color: 'text-green-500' }
}

/**
 * 校验手机号
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 校验邮箱
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 判断输入是邮箱还是手机号
 */
export function detectContactType(value: string): 'email' | 'phone' | 'invalid' {
  if (isValidEmail(value)) return 'email'
  if (isValidPhone(value)) return 'phone'
  return 'invalid'
}
