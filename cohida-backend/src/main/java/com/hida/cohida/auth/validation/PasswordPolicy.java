package com.hida.cohida.auth.validation;

public final class PasswordPolicy {
  private PasswordPolicy() {}

  public static boolean isStrong(String value) {
    return value != null
        && value.matches("(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}");
  }
}
