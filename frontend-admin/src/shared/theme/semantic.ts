import { colors } from './colors';

export const semantic = {
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[700],
    disabled: colors.gray[500],
    inverse: '#FFFFFF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: colors.gray[50],
    brand: colors.brand[50],
  },
  border: {
    default: colors.gray[200],
    strong: colors.gray[400],
  },
  button: {
    primaryBg: colors.brand[500],
    primaryHover: colors.brand[600],
    primaryText: '#FFFFFF',
  },
  status: {
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.info[500],
  },
} as const;
