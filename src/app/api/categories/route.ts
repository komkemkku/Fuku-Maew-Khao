import { NextRequest, NextResponse } from 'next/server';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

// Demo categories data
const initialCategories: Category[] = [
  {
    id: '1',
    name: 'อาหาร',
    description: 'ค่าใช้จ่ายเกี่ยวกับอาหารและเครื่องดื่ม',
    color: 'red',
    icon: '🍽️',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'เดินทาง',
    description: 'ค่าใช้จ่ายในการเดินทาง ค่าน้ำมัน ค่าโดยสาร',
    color: 'blue',
    icon: '🚗',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'บันเทิง',
    description: 'ภาพยนตร์ เกม กิจกรรมต่างๆ',
    color: 'purple',
    icon: '🎮',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'เสื้อผ้า',
    description: 'ค่าใช้จ่ายเกี่ยวกับเสื้อผ้าและเครื่องแต่งกาย',
    color: 'pink',
    icon: '👕',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'การศึกษา',
    description: 'หนังสือ คอร์สเรียน อุปกรณ์การเรียน',
    color: 'green',
    icon: '📚',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'สุขภาพ',
    description: 'ค่าหมอ ค่ายา ค่าออกกำลังกาย',
    color: 'blue',
    icon: '🏥',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// In-memory storage for demo
const demoData = {
  categories: [...initialCategories]
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const color = searchParams.get('color');

    let filteredCategories = [...demoData.categories];

    // Apply search filter
    if (search) {
      filteredCategories = filteredCategories.filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply color filter
    if (color) {
      filteredCategories = filteredCategories.filter(category => category.color === color);
    }

    return NextResponse.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || !color || !icon) {
      return NextResponse.json(
        { error: 'Name, color, and icon are required' },
        { status: 400 }
      );
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      description: description || undefined,
      color,
      icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    demoData.categories.push(newCategory);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, color, icon } = body;

    if (!id || !name || !color || !icon) {
      return NextResponse.json(
        { error: 'ID, name, color, and icon are required' },
        { status: 400 }
      );
    }

    const categoryIndex = demoData.categories.findIndex((cat: Category) => cat.id === id);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const updatedCategory: Category = {
      ...demoData.categories[categoryIndex],
      name,
      description: description || undefined,
      color,
      icon,
      updated_at: new Date().toISOString()
    };

    demoData.categories[categoryIndex] = updatedCategory;

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categoryIndex = demoData.categories.findIndex((cat: Category) => cat.id === id);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    demoData.categories.splice(categoryIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
