package com.hida.cohida.audit;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import jakarta.persistence.EntityManager;
import java.sql.SQLException;
import org.hibernate.Session;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.vendor.HibernateJpaDialect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.web.context.request.RequestContextHolder;

@Configuration
public class AuditTransactionConfiguration {
  @Bean
  static BeanPostProcessor auditTransactionManager() {
    return new BeanPostProcessor() {
      @Override
      public Object postProcessAfterInitialization(Object bean, String name)
          throws BeansException {
        if (bean instanceof JpaTransactionManager manager)
          manager.setJpaDialect(new AuditJpaDialect());
        return bean;
      }
    };
  }

  private static class AuditJpaDialect extends HibernateJpaDialect {
    @Override
    public Object beginTransaction(
        EntityManager entityManager, TransactionDefinition definition)
        throws SQLException {
      Object transaction = super.beginTransaction(entityManager, definition);
      if (definition.isReadOnly()) return transaction;
      var authentication =
          SecurityContextHolder.getContext().getAuthentication();
      Object principal = authentication == null
          ? null : authentication.getPrincipal();
      String actor = principal instanceof AuthenticatedCustomer customer
          ? customer.accountId().toString() : "";
      String kind = principal instanceof AuthenticatedCustomer ? "ACCOUNT"
          : RequestContextHolder.getRequestAttributes() == null
              ? "SYSTEM" : "ANONYMOUS";
      entityManager.unwrap(Session.class).doWork(connection -> {
        if (!"PostgreSQL".equals(connection.getMetaData()
            .getDatabaseProductName())) return;
        try (var statement = connection.prepareStatement(
            "select set_config('cohida.actor_kind', ?, true), "
                + "set_config('cohida.actor_id', ?, true)")) {
          statement.setString(1, kind);
          statement.setString(2, actor);
          statement.execute();
        }
      });
      return transaction;
    }
  }
}
