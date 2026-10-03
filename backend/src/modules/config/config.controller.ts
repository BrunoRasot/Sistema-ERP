import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { CreateSubChannelDto } from './dto/create-subchannel.dto';
import { UpdateSubChannelDto } from './dto/update-subchannel.dto';
import { CreateBottleConditionDto } from './dto/create-bottle-condition.dto';
import { UpdateBottleConditionDto } from './dto/update-bottle-condition.dto';
import { CreateBottleStockDto } from './dto/create-bottle-stock.dto';
import { UpdateBottleStockDto } from './dto/update-bottle-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Configuration & Bottle Control')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('bottles/summary')
  @ApiOperation({ summary: 'Obtener métricas consolidadas de bidones en clientes y planta' })
  getBottleSummary() {
    return this.configService.getBottleSummary();
  }

  @Get('bottles/transactions')
  @ApiOperation({ summary: 'Listar historial global de transacciones de envases' })
  getBottleTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.configService.getBottleTransactions(pageNum, limitNum, customerId, search);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Sembrar datos por defecto de configuración de la región Ica' })
  seedDefaults(@Query('force') force?: string) {
    const isForce = force === 'true' || force === '1';
    return this.configService.seedDefaults(isForce);
  }

  @Post('zones')
  createZone(@Body() dto: CreateZoneDto) {
    return this.configService.createZone(dto);
  }

  @Get('zones')
  findAllZones() {
    return this.configService.findAllZones();
  }

  @Get('zones/:id')
  findZone(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findZone(id);
  }

  @Patch('zones/:id')
  updateZone(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateZoneDto) {
    return this.configService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  deleteZone(@Param('id', ParseIntPipe) id: number) {
    return this.configService.deleteZone(id);
  }

  @Post('districts')
  createDistrict(@Body() dto: CreateDistrictDto) {
    return this.configService.createDistrict(dto);
  }

  @Get('districts')
  findAllDistricts(@Query('zoneId') zoneId?: string) {
    const parsedZoneId = zoneId ? parseInt(zoneId, 10) : undefined;
    return this.configService.findAllDistricts(parsedZoneId);
  }

  @Get('districts/:id')
  findDistrict(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findDistrict(id);
  }

  @Patch('districts/:id')
  updateDistrict(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDistrictDto) {
    return this.configService.updateDistrict(id, dto);
  }

  @Delete('districts/:id')
  deleteDistrict(@Param('id', ParseIntPipe) id: number) {
    return this.configService.deleteDistrict(id);
  }

  @Post('subchannels')
  createSubChannel(@Body() dto: CreateSubChannelDto) {
    return this.configService.createSubChannel(dto);
  }

  @Get('subchannels')
  findAllSubChannels(@Query('districtId') districtId?: string) {
    const parsedDistId = districtId ? parseInt(districtId, 10) : undefined;
    return this.configService.findAllSubChannels(parsedDistId);
  }

  @Get('subchannels/:id')
  findSubChannel(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findSubChannel(id);
  }

  @Patch('subchannels/:id')
  updateSubChannel(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubChannelDto) {
    return this.configService.updateSubChannel(id, dto);
  }

  @Delete('subchannels/:id')
  deleteSubChannel(@Param('id', ParseIntPipe) id: number) {
    return this.configService.deleteSubChannel(id);
  }

  @Post('bottle-conditions')
  createBottleCondition(@Body() dto: CreateBottleConditionDto) {
    return this.configService.createBottleCondition(dto);
  }

  @Get('bottle-conditions')
  findAllBottleConditions() {
    return this.configService.findAllBottleConditions();
  }

  @Patch('bottle-conditions/:id')
  updateBottleCondition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBottleConditionDto) {
    return this.configService.updateBottleCondition(id, dto);
  }

  @Delete('bottle-conditions/:id')
  deleteBottleCondition(@Param('id', ParseIntPipe) id: number) {
    return this.configService.deleteBottleCondition(id);
  }

  @Post('bottle-stocks')
  createBottleStock(@Body() dto: CreateBottleStockDto) {
    return this.configService.createBottleStock(dto);
  }

  @Get('bottle-stocks')
  findAllBottleStocks() {
    return this.configService.findAllBottleStocks();
  }

  @Patch('bottle-stocks/:id')
  updateBottleStock(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBottleStockDto) {
    return this.configService.updateBottleStock(id, dto);
  }
}
