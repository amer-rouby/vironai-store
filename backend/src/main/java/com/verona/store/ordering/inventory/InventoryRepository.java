package com.verona.store.ordering.inventory;

import com.verona.store.catalog.product.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/**
 * Stock movements as single conditional UPDATEs: the database checks and decrements in one atomic step,
 * so two shoppers can never both buy the last piece. The version bump keeps optimistic locking honest
 * for anyone holding a stale copy of the variant.
 * <p>
 * The persistence context is deliberately not cleared: callers keep working with the order they are
 * building or cancelling, and variants loaded in the same transaction are never written back (their
 * stock is only changed here, in SQL).
 */
public interface InventoryRepository extends JpaRepository<ProductVariant, Long> {

    @Modifying(flushAutomatically = true)
    @Query("""
            update ProductVariant v set v.stock = v.stock - :quantity, v.version = v.version + 1
            where v.id = :variantId and v.stock >= :quantity
            """)
    int reserve(@Param("variantId") Long variantId, @Param("quantity") int quantity);

    @Modifying(flushAutomatically = true)
    @Query("""
            update ProductVariant v set v.stock = v.stock + :quantity, v.version = v.version + 1
            where v.id = :variantId
            """)
    int release(@Param("variantId") Long variantId, @Param("quantity") int quantity);

    /** Variants with everything checkout needs to price and snapshot them, in one query. */
    @Query("""
            select v from ProductVariant v
              join fetch v.product p
              join fetch p.category
              join fetch v.color
              join fetch v.size
            where v.id in :ids
            """)
    List<ProductVariant> findForCheckout(@Param("ids") Collection<Long> ids);
}
