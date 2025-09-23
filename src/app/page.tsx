'use client';

import { Button, Container, Title, Text, Group, Stack, Box, ThemeIcon, Grid, Card, Badge } from '@mantine/core';
import { IconLock, IconUsers, IconTrophy, IconClock, IconStar, IconBrain } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <Container size="xl" className="relative z-10">
        {/* ヘッダー */}
        <Box className="pt-4 sm:pt-8 pb-4 px-4">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="xl" variant="gradient" gradient={{ from: 'purple', to: 'pink' }}>
                <IconLock size={24} />
              </ThemeIcon>
              <Title order={2} className="text-white font-bold text-lg sm:text-xl">
                脱出ゲーム
              </Title>
            </Group>
            <Badge size="lg" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }} className="text-sm sm:text-base">
              I2文化祭
            </Badge>
          </Group>
        </Box>

        {/* メインコンテンツ */}
        <Stack align="center" gap="xl" className="py-16">
          {/* メインタイトル */}
          <Stack align="center" gap="md" className="text-center">
            <Title
              order={1}
              className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 leading-tight px-4"
            >
              市工パピリオン
            </Title>
            <Title
              order={2}
              className="text-2xl sm:text-3xl md:text-5xl font-bold text-white/90 px-4"
            >
              からの脱出
            </Title>
            <Text size="xl" className="text-white/70 max-w-2xl text-center px-4">
              至高の技術と創造力が詰まった市工の文化祭で、<br className="hidden sm:block" />
              <span className="sm:hidden"> </span>あなたの知恵と勇気を試す脱出ゲームに挑戦しよう！
            </Text>
          </Stack>

          {/* 特徴カード */}
          <Grid className="w-full max-w-4xl" gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <IconBrain size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} className="text-white text-center">
                    謎解き
                  </Text>
                  <Text size="sm" className="text-white/70 text-center">
                    頭脳をフル活用して謎を解け
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                    <IconUsers size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} className="text-white text-center">
                    チーム戦
                  </Text>
                  <Text size="sm" className="text-white/70 text-center">
                    仲間と協力して脱出を目指せ
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                    <IconClock size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} className="text-white text-center">
                    時間制限
                  </Text>
                  <Text size="sm" className="text-white/70 text-center">
                    限られた時間で脱出せよ
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: 'red', to: 'pink' }}>
                    <IconTrophy size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} className="text-white text-center">
                    ランキング
                  </Text>
                  <Text size="sm" className="text-white/70 text-center">
                    最速脱出を目指せ
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* アクションボタン */}
          <Group gap="md" className="mt-8" justify="center">
            <Button
              size="xl"
              radius="xl"
              variant="outline"
              color="white"
              rightSection={<IconTrophy size={20} />}
              className="px-8 py-4 text-lg font-bold border-2 w-full sm:w-auto"
              onClick={() => router.push('/ranking')}
            >
              ランキング
            </Button>
          </Group>

          {/* 追加情報 */}
          <Card className="w-full max-w-2xl bg-white/5 backdrop-blur-sm border-white/10">
            <Stack align="center" gap="md">
              <Group gap="xs">
                <IconStar size={20} className="text-yellow-400" />
                <Text size="lg" fw={600} className="text-white">
                  至高の市工文化祭
                </Text>
                <IconStar size={20} className="text-yellow-400" />
              </Group>
              <Text size="sm" className="text-white/70 text-center px-4">
                最新の技術と創造性が融合した、<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>他では体験できない特別な脱出ゲームです。<br />
                あなたの知恵と勇気で、<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>市工パピリオンからの脱出を成功させてください！
              </Text>
            </Stack>
          </Card>
        </Stack>

        {/* フッター */}
        <Box className="py-8 text-center">
          <Text size="sm" className="text-white/50">
            © 2025 I2文化祭 市工パピリオン脱出ゲーム
          </Text>
        </Box>
      </Container>
    </div>
  );
}
