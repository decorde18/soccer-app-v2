// app/dashboard/page.js - Public landing page with progressive enhancement
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";

import { Card } from "@/components/ui/Card";

import { Grid, GridColumn } from "@/components/ui/Grid";

export default async function Dashboard() {
  // Check if user is logged in (optional on this page)
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  let user = null;
  if (token) {
    try {
      user = await verifyToken(token);
    } catch (error) {
      // Token invalid, treat as not logged in
      user = null;
    }
  }

  // Example Usage Component
  return (
    <div className='space-y-8 p-6'>
      <Grid gap='6'>
        <GridColumn span={4} spanMobile={12}>
          <Card
            variant='hover'
            shadow
            header='This is the header'
            title='This is the title'
            description='This is the description'
            icon='👤'
          >
            Content
          </Card>
        </GridColumn>
      </Grid>
      <div className='space-y-8 p-6'>
        {/* Grid Example */}
        <div>
          <h2 className='text-2xl font-bold mb-4'>Grid Layout</h2>

          <Card
            variant='clickable'
            description='Manage user accounts'
            icon='👤'
            title='Users'
          ></Card>

          <Card
            variant='hover'
            shadow
            description='Configure teams'
            title='Teams'
            icon='⚽'
          ></Card>

          <Card
            variant='outlined'
            description='View statistics'
            icon='📊'
            title='Stats'
          ></Card>
        </div>

        {/* List Example */}
        <div>
          <h2 className='text-2xl font-bold mb-4'>List Layout</h2>

          <Card
            variant='clickable'
            padding='md'
            description='Manage user accounts and permissions'
            title='Users'
            icon='👤'
          ></Card>

          <Card
            variant='clickable'
            padding='md'
            description='Configure teams and rosters'
            icon='⚽'
            title='Teams'
          ></Card>
        </div>

        {/* Complex Card Example */}
        <div>
          <h2 className='text-2xl font-bold mb-4'>Complex Card</h2>

          <Card
            variant='hover'
            shadow
            padding='lg'
            description='  Track your performance metrics'
            icon='📈'
            title='Analytics'
            footer={
              <button className='w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition'>
                View Details
              </button>
            }
          >
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted'>Total Users</span>
                <span className='font-semibold'>1,234</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted'>Active Teams</span>
                <span className='font-semibold'>56</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
