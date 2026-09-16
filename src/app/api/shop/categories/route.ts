import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/models';

// GET /api/shop/categories - Public: list active categories with item counts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree');

    if (tree === 'true') {
      // Get category tree with children populated
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();

      // Build tree
      interface TreeNode {
        _id: any;
        name: string;
        nameAm?: string;
        description?: string;
        descriptionAm?: string;
        imageUrl?: string;
        parentId: any;
        sortOrder: number;
        children: TreeNode[];
      }
      const buildTree = (parentId: string | null = null): TreeNode[] => {
        return categories
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((cat: any) => {
            const catParent = cat.parentId ? cat.parentId.toString() : null;
            return catParent === parentId;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((cat: any): TreeNode => ({
            _id: cat._id,
            name: cat.name,
            nameAm: cat.nameAm,
            description: cat.description,
            descriptionAm: cat.descriptionAm,
            imageUrl: cat.imageUrl,
            parentId: cat.parentId,
            sortOrder: cat.sortOrder,
            children: buildTree(cat._id.toString()),
          }));
      };

      return NextResponse.json({ categories: buildTree() });
    }

    // Flat list with virtual item counts
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate('itemCount')
      .lean();

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error('Error fetching shop categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
