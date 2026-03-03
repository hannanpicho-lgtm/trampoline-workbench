import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    // Only allow admin users
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Fetch all products
    const allProducts = await base44.asServiceRole.entities.Product.list('-created_date', 10000);
    
    // Filter products without valid images
    const productsToDelete = allProducts.filter(product => 
      !product.imageUrl || 
      product.imageUrl.trim() === '' ||
      product.imageUrl === 'undefined' ||
      product.imageUrl === 'null'
    );

    console.log(`Found ${productsToDelete.length} products without images out of ${allProducts.length} total`);

    // Delete products without images with delays to avoid rate limits
    let deletedCount = 0;
    
    for (const product of productsToDelete) {
      try {
        await base44.asServiceRole.entities.Product.delete(product.id);
        deletedCount++;
        // Add delay between deletions to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`Failed to delete product ${product.id}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: `Deleted ${deletedCount} products without images`,
      totalProducts: allProducts.length,
      deletedCount: deletedCount,
      remainingProducts: allProducts.length - deletedCount
    });

  } catch (error) {
    console.error('Error removing products:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});