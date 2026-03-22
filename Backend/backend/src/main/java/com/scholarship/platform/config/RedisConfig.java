package com.scholarship.platform.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache and mapping configuration.
 * <p>
 * Uses an in-memory cache by default (no Redis dependency required for the
 * college-project demo). Swap {@link ConcurrentMapCacheManager} for a
 * {@code RedisCacheManager} bean in production by adding the
 * {@code spring-boot-starter-data-redis} dependency and updating
 * {@code application.yml}.
 */
@Configuration
public class RedisConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "featured_scholarships",
                "platform_stats",
                "user_stats",
                "search_results"
        );
    }

    /**
     * ModelMapper configured with strict matching to prevent accidental
     * property mapping between similarly-named but semantically different fields.
     */
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration()
              .setMatchingStrategy(MatchingStrategies.STRICT)
              .setSkipNullEnabled(true);
        return mapper;
    }
}
