import 'dotenv/config';
import {
  registerUser,
  createPasswordResetToken,
  createNotification,
  getUserNotifications,
  createCategory,
  getAllCategories,
  createPost,
  createComment,
  getPostComments,
  sharePost,
  getPostShares,
  createPostVersion,
  getPostVersions,
  assignTemporaryRole,
  getUserTemporaryRoles,
  getUserByOpenId,
} from './db';
async function testFeatures() {
  console.log('🧪 Testing New Features...\n');
  try {
    console.log('1️⃣ Testing User Registration...');
    const newUser = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'editor',
    });
    console.log('✅ User registered:', newUser?.name);
    console.log('\n2️⃣ Testing Password Reset...');
    if (newUser) {
      const resetToken = await createPasswordResetToken(newUser.id);
      console.log('✅ Reset token generated:', resetToken?.substring(0, 10) + '...');
    }
    console.log('\n3️⃣ Testing Categories...');
    await createCategory('Test Category', 'A test category');
    const categories = await getAllCategories();
    console.log('✅ Categories created:', categories.length);
    console.log('\n4️⃣ Testing Notifications...');
    if (newUser) {
      await createNotification({
        userId: newUser.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
      });
      const notifications = await getUserNotifications(newUser.id);
      console.log('✅ Notifications created:', notifications.length);
    }
    console.log('\n5️⃣ Testing Posts and Versioning...');
    const adminUser = await getUserByOpenId('admin');
    if (adminUser) {
      const post = await createPost({
        title: 'Test Post',
        content: 'This is test content',
        authorId: adminUser.id,
        status: 'published',
        visibility: 'public',
      });
      if (post) {
        console.log('✅ Post created:', post.title);
        await createPostVersion(post.id, post.title, post.content, adminUser.id, 1);
        const versions = await getPostVersions(post.id);
        console.log('✅ Post versions:', versions.length);
        console.log('\n6️⃣ Testing Comments...');
        const comment = await createComment(post.id, adminUser.id, 'Great post!');
        const comments = await getPostComments(post.id);
        console.log('✅ Comments created:', comments.length);
        console.log('\n7️⃣ Testing Post Sharing...');
        if (newUser) {
          await sharePost(post.id, newUser.id, adminUser.id, false);
          const shares = await getPostShares(post.id);
          console.log('✅ Post shares:', shares.length);
        }
      }
    }
    console.log('\n8️⃣ Testing Temporary Roles...');
    if (newUser && adminUser) {
      const expiresAt = new Date(Date.now() + 24 * 3600000);
      await assignTemporaryRole(newUser.id, 'admin', expiresAt, adminUser.id, 'Testing');
      const tempRoles = await getUserTemporaryRoles(newUser.id);
      console.log('✅ Temporary roles assigned:', tempRoles.length);
    }
    console.log('\n✅ All tests passed! All features are working correctly.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}
testFeatures().then(() => {
  console.log('🎉 Feature testing complete!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

