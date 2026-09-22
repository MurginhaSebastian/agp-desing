package com.agpdesing.infrastructure.persistence.springdata;

import com.agpdesing.infrastructure.persistence.entity.SiteSettingJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataSiteSettingRepository extends JpaRepository<SiteSettingJpaEntity, String> {
}
